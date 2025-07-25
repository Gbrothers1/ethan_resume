# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2025-07-24

### Added
- GitHub Actions workflow for automated releases
- Release management script for easy versioning
- Comprehensive release documentation and guides
- GPG key integration for secure commits

### Changed
- Updated release script to handle GPG signing issues
- Improved changelog format and structure
- Enhanced release automation workflow

## [Unreleased]

## [1.3.0] - 2024-07-24

### Added
- Enhanced README with comprehensive feature documentation
- Green accent bars for content sections
- Hidden scrollbars for cleaner appearance
- Complete release management system

### Changed
- Improved content area styling and layout
- Adjusted padding and margins for consistent design
- Updated release process with automation

## [1.2.0] - 2024-07-24

### Added
- Comprehensive print functionality with multi-page support
- Dedicated print window with complete HTML generation
- Professional print styling with Times New Roman typography
- Print-specific CSS with proper page breaks
- Location/relocation/email extraction for print
- Disabled browser headers and footers for clean print output
- GitHub section excluded from print for professional paperwork

### Changed
- Print button now generates clean, application-ready output
- Print layout optimized for multi-page documents
- Contact information properly formatted for print

## [1.1.0] - 2024-07-24

### Added
- Mobile-friendly responsive design with touch optimization
- Horizontal scrollable navigation for mobile devices
- Tablet and mobile breakpoints (768px and 480px)
- Touch event handling for better mobile interaction
- Footer hidden on mobile for cleaner layout
- Enhanced mobile navigation with hover animations
- Prevent double-tap zoom on mobile navigation

### Changed
- Navigation redesigned for better mobile UX
- Mobile navigation uses horizontal scrolling tabs
- Improved touch targets and spacing for mobile
- Better typography scaling across devices

## [1.0.0] - 2024-07-24

### Added
- Terminal-style resume with dark theme and green accents
- Interactive section-based navigation
- Live GitHub integration with real-time commit feed
- GitHub contribution graph and security badge
- Responsive design for desktop and mobile
- Single-page application with smooth transitions
- Professional layout with proper typography
- Cloudflare Web Analytics integration

### Changed
- Initial release with core functionality
- Basic responsive design implemented
- GitHub API integration for live data

---

## How to Update This Changelog

### For New Features
```markdown
### Added
- Description of new feature
```

### For Bug Fixes
```markdown
### Fixed
- Description of bug fix
```

### For Breaking Changes
```markdown
### Changed
- Description of breaking change
```

### For Deprecated Features
```markdown
### Deprecated
- Description of deprecated feature
```

### For Removed Features
```markdown
### Removed
- Description of removed feature
```

### For Security Updates
```markdown
### Security
- Description of security update
```

## Version Format
- **MAJOR.MINOR.PATCH** (e.g., 1.2.0)
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

## Date Format
- Use YYYY-MM-DD format
- Example: 2024-07-24

## Commit Message Guidelines
- Use conventional commit format
- Examples:
  - `feat: add new feature`
  - `fix: resolve bug`
  - `docs: update documentation`
  - `style: improve formatting`
  - `refactor: restructure code`
  - `test: add tests`
  - `chore: maintenance tasks` 

---

## 1. **Check Pinentry Installation**

GPG uses a helper called `pinentry` to prompt for your passphrase. On macOS, you should have `pinentry-mac` installed.

**Install (or reinstall) pinentry-mac:**
```sh
brew install pinentry-mac
```

---

## 2. **Configure GPG to Use pinentry-mac**

Edit (or create) your GPG agent config file:
```sh
echo "pinentry-program /usr/local/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf
```
Or, if you’re on Apple Silicon (M1/M2), the path might be:
```sh
echo "pinentry-program /opt/homebrew/bin/pinentry-mac" >> ~/.gnupg/gpg-agent.conf
```

---

## 3. **Restart the GPG Agent**

```sh
gpgconf --kill gpg-agent
gpgconf --launch gpg-agent
```

---

## 4. **Test GPG Signing in a Real Terminal**

Now, in your terminal (not through an automated script), run:
```sh
echo "test" | gpg --clearsign
```
You should get a GUI prompt for your passphrase. Enter it, and GPG will cache it for a while.

---

## 5. **Try Your Git Commit Again**

After successfully signing once, try:
```sh
git commit -m "chore: test GPG signing with patch release"
```

---

### If you still don’t get a prompt:
- Make sure you’re not running in a VSCode/remote/automated shell that doesn’t support GUI prompts.
- Try running the above commands in the standard Terminal app.

---

Would you like me to run the Homebrew install and config steps for you, or would you like to try them yourself? If you want me to proceed, let me know if you’re on Intel or Apple Silicon (M1/M2) so I use the correct path! 
