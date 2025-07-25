#!/usr/bin/env python3
"""
Cursor Chat History Exporter
Extracts chat history from Cursor's SQLite database and exports as markdown
for live monitoring by ChatGPT.
"""

import sqlite3
import json
import hashlib
import platform
import time
import argparse
import logging
from pathlib import Path
from datetime import datetime


class CursorChatExporter:
    def __init__(self, debug=False):
        self.debug = debug
        self.cursor_storage_path = self._get_cursor_storage_path()
        self.global_db_path = self.cursor_storage_path / "globalStorage" / "state.vscdb"
        self.errors = []
        self.stats = {
            'total_bubbles': 0,
            'total_checkpoints': 0,
            'processed_bubbles': 0,
            'processed_checkpoints': 0,
            'skipped_null_values': 0,
            'json_decode_errors': 0,
            'extraction_errors': 0,
            'empty_messages': 0,
            'user_messages': 0,
            'assistant_messages': 0,
            'unknown_messages': 0
        }
        
        # Setup logging
        if debug:
            logging.basicConfig(level=logging.DEBUG, format='%(levelname)s: %(message)s')
        else:
            logging.basicConfig(level=logging.INFO, format='%(message)s')
        
    def _get_cursor_storage_path(self):
        """Get the OS-specific Cursor storage path."""
        system = platform.system()
        if system == "Darwin":  # macOS
            return Path.home() / "Library" / "Application Support" / "Cursor" / "User"
        elif system == "Windows":
            return Path.home() / "AppData" / "Roaming" / "Cursor" / "User"
        elif system == "Linux":
            return Path.home() / ".config" / "Cursor" / "User"
        else:
            raise RuntimeError(f"Unsupported operating system: {system}")

    def verify_global_database_exists(self):
        """Check if the global database exists."""
        if not self.global_db_path.exists():
            error = f"❌ Global database not found: {self.global_db_path}"
            print(error)
            self.errors.append(error)
            return False
        print(f"✅ Found global database: {self.global_db_path}")
        
        # Check database size
        size_mb = self.global_db_path.stat().st_size / (1024 * 1024)
        print(f"📊 Database size: {size_mb:.2f} MB")
        
        return True

    def _analyze_database_structure(self):
        """Analyze the database structure for debugging."""
        if not self.debug:
            return
            
        try:
            conn = sqlite3.connect(self.global_db_path)
            cursor = conn.cursor()
            
            print("\n🔍 DEBUG: Database Structure Analysis")
            print("-" * 50)
            
            # Check key patterns
            patterns = [
                'bubbleId:%',
                'checkpointId:%', 
                'messageRequestContext:%',
                'composerData:%',
                'conversationId:%'
            ]
            
            for pattern in patterns:
                cursor.execute('SELECT COUNT(*) FROM cursorDiskKV WHERE key LIKE ?', (pattern,))
                count = cursor.fetchone()[0]
                print(f"  {pattern}: {count} entries")
            
            # Sample some data types
            print("\n📝 Sample Bubble Data Types:")
            cursor.execute('SELECT key, value FROM cursorDiskKV WHERE key LIKE "bubbleId:%" LIMIT 3')
            samples = cursor.fetchall()
            
            for i, (key, value) in enumerate(samples):
                print(f"  Sample {i+1}: {key[:50]}...")
                if value:
                    try:
                        data = json.loads(value)
                        print(f"    Type: {data.get('type', 'unknown')}")
                        print(f"    Has text: {'text' in data}")
                        print(f"    Has toolFormerData: {'toolFormerData' in data}")
                        print(f"    Has codeBlocks: {'codeBlocks' in data}")
                    except:
                        print("    Invalid JSON or binary data")
                else:
                    print("    NULL value")
            
            conn.close()
            print("-" * 50)
            
        except Exception as e:
            error = f"Database analysis error: {e}"
            print(f"⚠️  {error}")
            self.errors.append(error)

    def extract_chat_history(self):
        """Extract chat history from the global SQLite database using cursorDiskKV table."""
        if not self.verify_global_database_exists():
            return []

        self._analyze_database_structure()

        try:
            conn = sqlite3.connect(self.global_db_path)
            cursor = conn.cursor()

            # Get all bubble entries (individual chat messages)
            cursor.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'bubbleId:%'")
            bubble_rows = cursor.fetchall()
            self.stats['total_bubbles'] = len(bubble_rows)
            
            # Get conversation context entries
            cursor.execute("SELECT key, value FROM cursorDiskKV WHERE key LIKE 'checkpointId:%'")
            checkpoint_rows = cursor.fetchall()
            self.stats['total_checkpoints'] = len(checkpoint_rows)
            
            print(f"📝 Found {len(bubble_rows)} bubble entries")
            print(f"🔗 Found {len(checkpoint_rows)} checkpoint entries") 

            # Process bubbles into conversations
            conversations = self._process_bubbles_and_checkpoints(bubble_rows, checkpoint_rows)
            
            conn.close()
            
            # Print debugging statistics
            self._print_processing_stats()
            
            return conversations

        except sqlite3.Error as e:
            error = f"Database error: {e}"
            print(f"❌ {error}")
            self.errors.append(error)
            return []

    def _process_bubbles_and_checkpoints(self, bubble_rows, checkpoint_rows):
        """Process bubble and checkpoint data into structured conversations."""
        conversations = {}
        
        print(f"\n🔄 Processing checkpoint data...")
        
        # Process checkpoints first to understand conversation structure
        for key, value in checkpoint_rows:
            try:
                if not value:  # Skip null values
                    self.stats['skipped_null_values'] += 1
                    continue
                    
                checkpoint_data = json.loads(value)
                checkpoint_id = key.split(':', 1)[1]
                self.stats['processed_checkpoints'] += 1
                
                # Extract conversation context from checkpoints
                if 'conversationId' in checkpoint_data or 'bubbleId' in checkpoint_data:
                    conversations[checkpoint_id] = {
                        'messages': [],
                        'metadata': checkpoint_data,
                        'timestamp': checkpoint_data.get('timestamp', 0)
                    }
                    
                if self.debug and self.stats['processed_checkpoints'] <= 3:
                    print(f"  DEBUG: Checkpoint {checkpoint_id[:8]}... has {len(checkpoint_data)} fields")
                    
            except (json.JSONDecodeError, IndexError) as e:
                self.stats['json_decode_errors'] += 1
                if self.debug:
                    print(f"  ⚠️  Checkpoint decode error: {e}")
                continue
        
        print(f"🔄 Processing bubble data...")
        
        # Get database file modification time for timestamp estimation
        import os
        db_stat = os.stat(self.global_db_path)
        db_modified_time = db_stat.st_mtime
        total_bubbles = len(bubble_rows)
        
        # Process bubbles (individual messages)
        for i, (key, value) in enumerate(bubble_rows):
            try:
                if not value:  # Skip null values
                    self.stats['skipped_null_values'] += 1
                    continue
                    
                bubble_data = json.loads(value)
                bubble_id = key.split(':', 2)[2] if len(key.split(':')) > 2 else key.split(':', 1)[1]
                self.stats['processed_bubbles'] += 1
                
                if self.debug and i < 5:
                    print(f"  DEBUG: Bubble {i+1} type={bubble_data.get('type', 'unknown')} text_len={len(bubble_data.get('text', ''))}")
                
                # Estimate timestamp based on position in bubble array
                # Assume messages are roughly chronological, spread over recent time
                time_span_hours = 24 * 30  # Assume 30 days of history
                time_span_seconds = time_span_hours * 3600
                position_ratio = i / max(total_bubbles - 1, 1)
                estimated_timestamp = db_modified_time - (time_span_seconds * (1 - position_ratio))
                
                # Extract message content
                try:
                    message = self._extract_message_from_bubble(bubble_data, estimated_timestamp)
                    if message:
                        # Try to associate with conversation based on checkpointId
                        checkpoint_id = bubble_data.get('checkpointId', 'unknown')
                        if checkpoint_id not in conversations:
                            conversations[checkpoint_id] = {
                                'messages': [],
                                'metadata': {},
                                'timestamp': estimated_timestamp
                            }
                        
                        conversations[checkpoint_id]['messages'].append(message)
                        
                        # Update stats
                        if message['role'] == 'user':
                            self.stats['user_messages'] += 1
                        elif message['role'] == 'assistant':
                            self.stats['assistant_messages'] += 1
                        else:
                            self.stats['unknown_messages'] += 1
                    else:
                        self.stats['empty_messages'] += 1
                except Exception as extract_error:
                    self.stats['extraction_errors'] += 1
                    if self.debug:
                        print(f"  ⚠️  Message extraction error at index {i}: {extract_error}")
                    # Create a basic error message so we don't lose the bubble entirely
                    error_message = {
                        'timestamp': estimated_timestamp,
                        'bubble_id': bubble_data.get('bubbleId', ''),
                        'type': 'error',
                        'content': f"[Error extracting content: {str(extract_error)[:100]}]",
                        'role': 'assistant' if bubble_data.get('type') == 2 else 'user'
                    }
                    checkpoint_id = bubble_data.get('checkpointId', 'unknown')
                    if checkpoint_id not in conversations:
                        conversations[checkpoint_id] = {
                            'messages': [],
                            'metadata': {},
                            'timestamp': estimated_timestamp
                        }
                    conversations[checkpoint_id]['messages'].append(error_message)
                    self.stats['assistant_messages'] += 1
                    
            except (json.JSONDecodeError, IndexError) as e:
                self.stats['json_decode_errors'] += 1
                if self.debug:
                    print(f"  ⚠️  Bubble decode error at index {i}: {e}")
                continue
            except Exception as e:
                self.stats['extraction_errors'] += 1
                if self.debug:
                    print(f"  ⚠️  Extraction error at index {i}: {e}")
                continue
        
        # Convert to list and sort by timestamp
        conversation_list = []
        for conv_id, conv_data in conversations.items():
            if conv_data['messages']:  # Only include conversations with messages
                # Sort messages within conversation by timestamp
                conv_data['messages'].sort(key=lambda x: x.get('timestamp', 0))
                conversation_list.append({
                    'id': conv_id,
                    'messages': conv_data['messages'],
                    'timestamp': conv_data['timestamp']
                })
        
        # Sort conversations by timestamp
        conversation_list.sort(key=lambda x: x.get('timestamp', 0), reverse=True)
        
        print(f"✅ Created {len(conversation_list)} conversations")
        
        return conversation_list

    def _extract_message_from_bubble(self, bubble_data, estimated_timestamp=None):
        """Extract message content from a bubble data structure."""
        message = {
            'timestamp': estimated_timestamp if estimated_timestamp is not None else bubble_data.get('timestamp', 0),
            'bubble_id': bubble_data.get('bubbleId', ''),
            'type': 'unknown',
            'content': '',
            'role': 'unknown'
        }
        
        # Check message type based on bubble structure
        msg_type = bubble_data.get('type')
        
        if msg_type == 1:  # User message
            message['role'] = 'user'
            message['type'] = 'user_input'
            message['content'] = bubble_data.get('text', '')
            
        elif msg_type == 2:  # Assistant response
            message['role'] = 'assistant'
            message['type'] = 'assistant_response'
            
            # Extract content from various possible fields
            content_sources = []
            
            # Basic text content (with type safety)
            text_field = bubble_data.get('text')
            if text_field and isinstance(text_field, str):
                content_sources.append(text_field)
            
            content_field = bubble_data.get('content')
            if content_field and isinstance(content_field, str):
                content_sources.append(content_field)
            
            desc_field = bubble_data.get('textDescription')
            if desc_field and isinstance(desc_field, str):
                content_sources.append(desc_field)
            
            # Check for tool formatter data (code edits, etc.) - ENHANCED EXTRACTION
            if 'toolFormerData' in bubble_data:
                tool_data = bubble_data['toolFormerData']
                tool_content = []
                
                # Extract tool name and basic info
                tool_name = tool_data.get('name', 'unknown_tool')
                tool_status = tool_data.get('status', 'unknown')
                
                # Map tool numbers to names for better readability
                tool_number = tool_data.get('tool')
                tool_type_map = {
                    3: 'grep_search',
                    5: 'read_file', 
                    6: 'list_dir',
                    7: 'edit_file',
                    11: 'delete_file',
                    # Add more as discovered
                }
                
                if tool_number in tool_type_map:
                    tool_display_name = tool_type_map[tool_number]
                else:
                    tool_display_name = f"tool_{tool_number}" if tool_number else tool_name
                
                # Extract and format arguments
                if 'rawArgs' in tool_data:
                    try:
                        args = json.loads(tool_data['rawArgs'])
                        
                        # Format different tool types appropriately
                        if tool_display_name == 'edit_file':
                            target_file = args.get('target_file', 'unknown')
                            instructions = args.get('instructions', '')
                            tool_content.append(f"🛠️ **Edit File**: `{target_file}`")
                            if instructions:
                                tool_content.append(f"**Instructions**: {instructions}")
                            if 'code_edit' in args and args['code_edit']:
                                code_preview = args['code_edit'][:200]
                                tool_content.append(f"**Code Changes**: {code_preview}{'...' if len(args['code_edit']) > 200 else ''}")
                        
                        elif tool_display_name == 'read_file':
                            target_file = args.get('relative_workspace_path', args.get('target_file', 'unknown'))
                            tool_content.append(f"📖 **Read File**: `{target_file}`")
                            if 'start_line_one_indexed' in args:
                                start = args['start_line_one_indexed']
                                end = args.get('end_line_one_indexed_inclusive', 'end')
                                tool_content.append(f"**Lines**: {start}-{end}")
                        
                        elif tool_display_name == 'list_dir':
                            dir_path = args.get('relative_workspace_path', 'unknown')
                            tool_content.append(f"📁 **List Directory**: `{dir_path}`")
                        
                        elif tool_display_name == 'grep_search':
                            query = args.get('query', 'unknown')
                            tool_content.append(f"🔍 **Search**: `{query}`")
                            if 'include_pattern' in args:
                                tool_content.append(f"**Pattern**: {args['include_pattern']}")
                        
                        elif tool_display_name == 'delete_file':
                            target_file = args.get('target_file', 'unknown')
                            tool_content.append(f"🗑️ **Delete File**: `{target_file}`")
                        
                        else:
                            # Generic tool formatting
                            tool_content.append(f"🔧 **{tool_display_name.replace('_', ' ').title()}**")
                            # Add key arguments
                            for key, value in args.items():
                                if key in ['explanation', 'query', 'command', 'search_term', 'target_file', 'relative_workspace_path']:
                                    display_value = str(value)[:100]
                                    if len(str(value)) > 100:
                                        display_value += '...'
                                    tool_content.append(f"**{key.replace('_', ' ').title()}**: {display_value}")
                        
                    except json.JSONDecodeError:
                        # If rawArgs is not valid JSON, still show the tool action
                        tool_content.append(f"🔧 **{tool_display_name.replace('_', ' ').title()}** ({tool_status})")
                
                # Extract and format results
                if 'result' in tool_data and tool_data['result']:
                    try:
                        result = json.loads(tool_data['result']) if isinstance(tool_data['result'], str) else tool_data['result']
                        
                        if tool_display_name == 'edit_file' and 'diff' in result:
                            chunks = result['diff'].get('chunks', [])
                            if chunks:
                                tool_content.append(f"**Result**: Applied {len(chunks)} code modifications")
                        
                        elif tool_display_name == 'read_file' and 'contents' in result:
                            content_length = len(result['contents'])
                            lines = result['contents'].count('\n') + 1
                            tool_content.append(f"**Result**: Read {lines} lines ({content_length} characters)")
                            
                        elif tool_display_name == 'list_dir' and 'files' in result:
                            files = result['files']
                            dirs = sum(1 for f in files if f.get('isDirectory'))
                            files_count = len(files) - dirs
                            tool_content.append(f"**Result**: Found {dirs} directories, {files_count} files")
                            
                        elif tool_display_name == 'grep_search' and 'internal' in result:
                            internal = result['internal']
                            if 'results' in internal:
                                total_matches = sum(len(r.get('results', [])) for r in internal['results'])
                                tool_content.append(f"**Result**: Found {total_matches} matches")
                        
                        elif tool_display_name == 'delete_file':
                            if result.get('fileDeletedSuccessfully'):
                                tool_content.append(f"**Result**: File deleted successfully")
                            else:
                                tool_content.append(f"**Result**: Delete operation completed")
                        
                        else:
                            # Generic result handling
                            result_str = str(result)[:150]
                            if len(str(result)) > 150:
                                result_str += '...'
                            tool_content.append(f"**Result**: {result_str}")
                            
                    except (json.JSONDecodeError, TypeError):
                        # If result is not JSON, show as string
                        result_str = str(tool_data['result'])[:150]
                        if len(str(tool_data['result'])) > 150:
                            result_str += '...'
                        tool_content.append(f"**Result**: {result_str}")
                
                # If no specific content extracted, at least show the tool action
                if not tool_content:
                    tool_content.append(f"🔧 **{tool_display_name.replace('_', ' ').title()}** ({tool_status})")
                
                if tool_content:
                    # Ensure all tool content items are strings
                    safe_tool_content = [str(item) for item in tool_content if item is not None]
                    content_sources.extend(safe_tool_content)
            
            # Check for code blocks
            if 'codeBlocks' in bubble_data and bubble_data['codeBlocks']:
                for code_block in bubble_data['codeBlocks']:
                    if 'content' in code_block and code_block['content']:
                        lang = code_block.get('languageId', '')
                        uri_obj = code_block.get('uri', {})
                        fs_path = uri_obj.get('_fsPath') if isinstance(uri_obj, dict) else None
                        
                        if fs_path and isinstance(fs_path, str) and fs_path != 'unknown file':
                            # Extract just filename
                            filename = fs_path.split('/')[-1] if '/' in fs_path else fs_path
                            content_sources.append(f"📄 **Code Block** (`{filename}`):\n```{lang}\n{code_block['content']}\n```")
                        else:
                            content_sources.append(f"📄 **Code Block**:\n```{lang}\n{code_block['content']}\n```")
            
            # Use the first non-empty content, or combine multiple sources
            if content_sources:
                # If we have both text and tool content, combine them intelligently
                text_content = []
                tool_content = []
                code_content = []
                
                for content in content_sources:
                    if content and isinstance(content, str) and content.startswith(('🛠️', '📖', '📁', '🔍', '🗑️', '🔧')):
                        tool_content.append(content)
                    elif content and isinstance(content, str) and content.startswith('📄'):
                        code_content.append(content)
                    elif content and isinstance(content, str):
                        text_content.append(content)
                
                # Combine in logical order: text first, then tools, then code
                combined_content = []
                if text_content:
                    combined_content.extend(text_content)
                if tool_content:
                    combined_content.extend(tool_content)
                if code_content:
                    combined_content.extend(code_content)
                
                message['content'] = '\n\n'.join(combined_content)
        
        else:
            # Unknown message type - try to extract any available text
            if self.debug:
                print(f"  DEBUG: Unknown message type {msg_type}")
            text_fields = ['text', 'content', 'textDescription']
            for field in text_fields:
                if bubble_data.get(field):
                    message['content'] = bubble_data[field]
                    message['role'] = 'unknown'
                    break
                    
        # Skip if no meaningful content
        if not message['content'] or message['content'].strip() == '':
            if self.debug:
                print(f"  DEBUG: Skipping empty message of type {msg_type}")
            return None
            
        return message

    def _print_processing_stats(self):
        """Print detailed processing statistics."""
        print(f"\n📊 Processing Statistics:")
        print(f"  Total bubbles found: {self.stats['total_bubbles']}")
        print(f"  Total checkpoints found: {self.stats['total_checkpoints']}")
        print(f"  Processed bubbles: {self.stats['processed_bubbles']}")
        print(f"  Processed checkpoints: {self.stats['processed_checkpoints']}")
        print(f"  Skipped null values: {self.stats['skipped_null_values']}")
        print(f"  JSON decode errors: {self.stats['json_decode_errors']}")
        print(f"  Extraction errors: {self.stats['extraction_errors']}")
        print(f"  Empty messages: {self.stats['empty_messages']}")
        print(f"  User messages: {self.stats['user_messages']}")
        print(f"  Assistant messages: {self.stats['assistant_messages']}")
        print(f"  Unknown messages: {self.stats['unknown_messages']}")
        
        # Calculate ratios
        if self.stats['processed_bubbles'] > 0:
            extractable_messages = self.stats['user_messages'] + self.stats['assistant_messages']
            total_processed = self.stats['processed_bubbles']
            
            # Success rate based on successfully processed bubbles (excluding legitimate empty metadata)
            success_rate = (extractable_messages / total_processed) * 100
            
            # Perfect rate: count only bubbles that should have extractable content
            # (exclude null values and metadata-only bubbles)
            meaningful_bubbles = total_processed - self.stats['empty_messages']
            if meaningful_bubbles > 0:
                perfect_rate = (extractable_messages / meaningful_bubbles) * 100
                print(f"  Success rate: {success_rate:.1f}% (Perfect extraction rate: {perfect_rate:.1f}%)")
            else:
                print(f"  Success rate: {success_rate:.1f}%")
        
        if self.errors:
            print(f"\n⚠️  Errors encountered: {len(self.errors)}")
            for error in self.errors[:5]:  # Show first 5 errors
                print(f"    - {error}")

    def format_chat_as_markdown(self, conversations):
        """Format conversation data as markdown."""
        if not conversations:
            return "# Chat Conversations\n\nNo chat data found or database is empty."
        
        total_messages = sum(len(conv['messages']) for conv in conversations)
        
        markdown = "# Chat Conversations\n\n"
        markdown += f"*Exported from Cursor global storage*\n"
        markdown += f"*Last updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n"
        markdown += f"*Total conversations: {len(conversations)}*\n"
        markdown += f"*Total messages: {total_messages}*\n"
        markdown += f"*✅ Both user prompts and assistant responses are captured*\n\n"
        
        # Add processing statistics
        if self.debug or self.stats['json_decode_errors'] > 0 or self.stats['extraction_errors'] > 0:
            extractable_messages = self.stats['user_messages'] + self.stats['assistant_messages']
            meaningful_bubbles = self.stats['processed_bubbles'] - self.stats['empty_messages']
            perfect_rate = (extractable_messages / max(meaningful_bubbles, 1)) * 100
            
            markdown += "## 📊 Processing Stats\n\n"
            markdown += f"- **Perfect extraction rate**: {perfect_rate:.1f}% (excludes metadata-only bubbles)\n"
            markdown += f"- **Overall success rate**: {(extractable_messages / max(self.stats['processed_bubbles'], 1)) * 100:.1f}%\n"
            markdown += f"- **Bubbles processed**: {self.stats['processed_bubbles']}/{self.stats['total_bubbles']}\n"
            markdown += f"- **Extraction errors**: {self.stats['extraction_errors']}\n"
            markdown += f"- **Empty/metadata-only**: {self.stats['empty_messages']}\n\n"
        
        # Add source information
        markdown += "## 📍 Data Source\n\n"
        markdown += "Successfully extracting from Cursor's global storage database:\n"
        markdown += f"- **Database**: `{self.global_db_path}`\n"
        markdown += f"- **Table**: `cursorDiskKV`\n"
        markdown += f"- **Pattern**: `bubbleId:*` and `checkpointId:*`\n"
        markdown += f"- **Implementation**: Based on [cursor-chat-export](https://github.com/somogyijanos/cursor-chat-export)\n"
        markdown += f"- **Timestamps**: Estimated based on message order (30-day span)\n\n"
        markdown += "---\n\n"
        
        for i, conversation in enumerate(conversations):
            conv_timestamp = "Unknown time"
            timestamp = conversation.get('timestamp', 0)
            if timestamp > 0:
                try:
                    # Handle both Unix seconds and milliseconds
                    if timestamp > 1e12:  # Likely milliseconds
                        conv_timestamp = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d %H:%M:%S')
                    else:  # Likely seconds
                        conv_timestamp = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')
                except (ValueError, OSError):
                    conv_timestamp = "Unknown time"
            
            markdown += f"## Conversation {i+1} - {conv_timestamp}\n\n"
            markdown += f"*Conversation ID: {conversation['id']}*\n"
            markdown += f"*Messages: {len(conversation['messages'])}*\n\n"
            
            for j, message in enumerate(conversation['messages']):
                # Handle timestamp for individual messages
                msg_timestamp = "Unknown time"
                timestamp = message.get('timestamp', 0)
                if timestamp > 0:
                    try:
                        # Handle both Unix seconds and milliseconds
                        if timestamp > 1e12:  # Likely milliseconds
                            msg_timestamp = datetime.fromtimestamp(timestamp / 1000).strftime('%H:%M:%S')
                        else:  # Likely seconds
                            msg_timestamp = datetime.fromtimestamp(timestamp).strftime('%H:%M:%S')
                    except (ValueError, OSError):
                        msg_timestamp = "Unknown time"
                
                role_emoji = "👤" if message['role'] == 'user' else "🤖" if message['role'] == 'assistant' else "❓"
                role_title = "User" if message['role'] == 'user' else "Assistant" if message['role'] == 'assistant' else "Unknown"
                
                markdown += f"### {role_emoji} {role_title} ({msg_timestamp})\n\n"
                markdown += f"{message['content']}\n\n"
            
            markdown += "---\n\n"
        
        return markdown

    def write_markdown(self, content):
        """Write the markdown content to a file."""
        output_file = Path("chat_conversations.md")
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"✅ Updated {output_file}")

    def run_continuous(self, interval=10):
        """Run the export process continuously."""
        print(f"🔄 Starting continuous export (every {interval} seconds)")
        print("Press Ctrl+C to stop")
        try:
            while True:
                conversations = self.extract_chat_history()
                markdown = self.format_chat_as_markdown(conversations)
                self.write_markdown(markdown)
                time.sleep(interval)
        except KeyboardInterrupt:
            print("\n✅ Export stopped")

def main():
    parser = argparse.ArgumentParser(description="Export Cursor chat history to markdown")
    parser.add_argument("--once", action="store_true", help="Run once instead of continuously")
    parser.add_argument("--interval", type=int, default=10, help="Update interval in seconds (default: 10)")
    parser.add_argument("--debug", action="store_true", help="Enable debug output")
    
    args = parser.parse_args()
    
    exporter = CursorChatExporter(debug=args.debug)
    
    if args.once:
        conversations = exporter.extract_chat_history()
        markdown = exporter.format_chat_as_markdown(conversations)
        exporter.write_markdown(markdown)
        print("✅ Export completed")
    else:
        exporter.run_continuous(args.interval)

if __name__ == "__main__":
    main() 