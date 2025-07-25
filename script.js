console.log('🚀 SCRIPT LOADED - script.js is executing!');
console.log('🚀 Current time:', new Date().toLocaleTimeString());

// Show body once page is ready to prevent FOUC
document.addEventListener('DOMContentLoaded', function() {
  // Small delay to ensure CSS is fully applied
  setTimeout(() => {
    document.body.classList.add('loaded');
    console.log('✅ Page fully loaded and styled');
  }, 50);
});

// Test if basic DOM elements exist
setTimeout(() => {
  console.log('🔍 Testing DOM elements...');
  console.log('🔍 Cover letter element:', document.getElementById('cover-letter'));
  console.log('🔍 Navigation elements:', document.querySelectorAll('.nav a').length);
}, 1000);

/* ---------- Simple Typing Animation (Based on Proven Web Examples) ---------- */
let typingTimeout = null;
let isCurrentlyTyping = false;
let hasTypedOnce = false; // Track if animation has run before

function startTypingAnimation() {
  console.log('=== STARTING TYPING ANIMATION ===');
  
  // Find the cover letter text element
  const coverLetterSection = document.getElementById('cover-letter');
  if (!coverLetterSection) {
    console.error('Cover letter section not found');
    return;
  }
  console.log('✓ Cover letter section found');
  
  const textElement = coverLetterSection.nextElementSibling;
  if (!textElement || !textElement.classList.contains('content-text')) {
    console.error('Cover letter text element not found');
    return;
  }
  console.log('✓ Text element found:', textElement);
  
  // Store original text if not already stored
  if (!textElement.dataset.originalText) {
    textElement.dataset.originalText = textElement.textContent.trim();
    console.log('✓ Stored original text');
  }
  
  const originalText = textElement.dataset.originalText;
  console.log('✓ Text to type length:', originalText.length);
  console.log('✓ Text preview:', originalText.substring(0, 100) + '...');
  
  // Clear any existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    console.log('✓ Cleared existing timeout');
  }
  
  // Reset state
  isCurrentlyTyping = true;
  hasTypedOnce = true; // Mark that animation has run
  
  // Clear text and start typing immediately (no fade for first load)
  textElement.textContent = '';
  textElement.classList.add('typing-active');
  console.log('✓ Text cleared, starting animation...');
  
  let currentIndex = 0;
  
  function typeNextCharacter() {
    if (currentIndex < originalText.length && isCurrentlyTyping) {
      textElement.textContent = originalText.substring(0, currentIndex + 1);
      currentIndex++;
      
      // Log progress every 100 characters
      if (currentIndex % 100 === 0) {
        console.log(`Typing progress: ${currentIndex}/${originalText.length}`);
      }
      
      // Auto-scroll to keep text visible
      const contentArea = document.getElementById('content-area');
      if (contentArea) {
        contentArea.scrollTop = contentArea.scrollHeight;
      }
      
      // Continue typing
      typingTimeout = setTimeout(typeNextCharacter, 80); // 80ms per character for visible typing
    } else {
      // Animation complete
      isCurrentlyTyping = false;
      textElement.classList.remove('typing-active');
      console.log('✓ Typing animation completed successfully!');
    }
  }
  
  console.log('✓ Starting first character...');
  typeNextCharacter();
}

function stopTypingAnimation() {
  console.log('Stopping typing animation...');
  
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }
  
  isCurrentlyTyping = false;
  
  // Find and reset the text element
  const coverLetterSection = document.getElementById('cover-letter');
  if (coverLetterSection) {
    const textElement = coverLetterSection.nextElementSibling;
    if (textElement && textElement.classList.contains('content-text')) {
      textElement.classList.remove('typing-active');
      if (textElement.dataset.originalText) {
        textElement.textContent = textElement.dataset.originalText;
      }
    }
  }
}

/* ---------- Navigation functionality ---------- */
function showSection(sectionId) {
  console.log('Showing section:', sectionId);
  
  // Stop any ongoing typing animation when switching sections
  if (isCurrentlyTyping && sectionId !== 'cover-letter') {
    stopTypingAnimation();
  }
  
  // Get the content area container
  const contentArea = document.getElementById('content-area');
  
  // Hide all sections
  const allSections = document.querySelectorAll('.section, .content-text, .skills-grid, .projects-list, .github-box');
  allSections.forEach(section => {
    section.style.display = 'none';
  });
  
  // Show only the selected section and its content
  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.style.display = 'block';
    
    // Show the content that follows this section until the next section
    let nextElement = selectedSection.nextElementSibling;
    while (nextElement && !nextElement.classList.contains('section')) {
      nextElement.style.display = 'block';
      
      // Special handling for cover letter
      if (sectionId === 'cover-letter' && nextElement.classList.contains('content-text')) {
        // Store original text if not already stored
        if (!nextElement.dataset.originalText) {
          nextElement.dataset.originalText = nextElement.textContent.trim();
        }
        
        if (hasTypedOnce) {
          // Animation has run before - show full text immediately
          nextElement.textContent = nextElement.dataset.originalText;
          console.log('✓ Showing full cover letter text (animation already completed once)');
        } else {
          // First time - prepare for animation
          nextElement.textContent = '';
          console.log('✓ Pre-cleared cover letter text for first-time animation');
        }
      }
      
      nextElement = nextElement.nextElementSibling;
    }
  }
  
  // Update active navigation button
  updateActiveNav(sectionId);
  
  // Reset scroll position for new section
  if (contentArea) {
    contentArea.scrollTop = 0;
  }
  
  // If cover letter is selected and animation hasn't run yet, start it
  if (sectionId === 'cover-letter' && !hasTypedOnce) {
    console.log('🎯 Cover letter selected for first time - will start typing animation in 100ms');
    setTimeout(() => {
      console.log('🚀 Timeout fired - calling startTypingAnimation()');
      startTypingAnimation();
    }, 100);
  } else if (sectionId === 'cover-letter') {
    console.log('📄 Cover letter selected - showing full text (animation already completed)');
  } else {
    console.log('📄 Other section selected:', sectionId);
  }
}

function updateActiveNav(activeId) {
  // Remove active class from all nav buttons
  const navButtons = document.querySelectorAll('.nav a');
  navButtons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active class to clicked button
  const activeButton = document.querySelector(`.nav a[href="#${activeId}"]`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
}

function showAllSections() {
  // Stop typing animation when showing all sections
  stopTypingAnimation();
  
  // Show all sections
  const allSections = document.querySelectorAll('.section, .content-text, .skills-grid, .projects-list, .github-box');
  allSections.forEach(section => {
    section.style.display = 'block';
  });
  
  // Remove active class from all nav buttons
  const navButtons = document.querySelectorAll('.nav a');
  navButtons.forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Reset scroll to top
  const contentArea = document.getElementById('content-area');
  if (contentArea) {
    contentArea.scrollTop = 0;
  }
}

// Function to show section without triggering animation (for initial load)
function showSectionWithoutAnimation(sectionId) {
  console.log('Showing section without animation:', sectionId);
  
  // Get the content area container
  const contentArea = document.getElementById('content-area');
  
  // Hide all sections
  const allSections = document.querySelectorAll('.section, .content-text, .skills-grid, .projects-list, .github-box');
  allSections.forEach(section => {
    section.style.display = 'none';
  });
  
  // Show only the selected section and its content
  const selectedSection = document.getElementById(sectionId);
  if (selectedSection) {
    selectedSection.style.display = 'block';
    
    // Show the content that follows this section until the next section
    let nextElement = selectedSection.nextElementSibling;
    while (nextElement && !nextElement.classList.contains('section')) {
      nextElement.style.display = 'block';
      nextElement = nextElement.nextElementSibling;
    }
  }
  
  // Update active navigation button
  updateActiveNav(sectionId);
  
  // Reset scroll position
  if (contentArea) {
    contentArea.scrollTop = 0;
  }
  
  // Store original text but don't start animation
  if (sectionId === 'cover-letter') {
    const coverLetterSection = document.getElementById('cover-letter');
    if (coverLetterSection) {
      const textElement = coverLetterSection.nextElementSibling;
      if (textElement && textElement.classList.contains('content-text')) {
        if (!textElement.dataset.originalText) {
          textElement.dataset.originalText = textElement.textContent.trim();
          console.log('Stored original text for later animation');
        }
      }
    }
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing...');
  
  // Set up navigation
  const navButtons = document.querySelectorAll('.nav a');
  navButtons.forEach(button => {
    const handleNavigation = function(e) {
      e.preventDefault();
      const sectionId = this.getAttribute('href').substring(1);
      console.log('🔥 NAVIGATION CLICKED:', sectionId);
      console.log('🔥 Button element:', this);
      console.log('🔥 href attribute:', this.getAttribute('href'));
      showSection(sectionId);
    };
    
    button.addEventListener('click', handleNavigation);
    button.addEventListener('touchend', handleNavigation);
    
    button.addEventListener('touchstart', function(e) {
      e.preventDefault();
    });
  });
  
  // Show cover letter initially WITH typing animation (first load)
  console.log('Showing initial cover letter section (will start animation)');
  showSection('cover-letter');
  
  // Print functionality
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.print();
    });
  }
});

/* ---------- Live commit feed (per-repo) ---------- */
(async function () {
  const feed = document.getElementById('commitFeed');
  if (!feed) return;

  try {
    const res = await fetch(
      'https://api.github.com/repos/gbrothers1/ethan_resume/commits?per_page=8',
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    const commits = await res.json();
    if (!Array.isArray(commits) || !commits.length) {
      feed.textContent = 'No commits yet.';
      return;
    }

    const ul = document.createElement('ul');
    commits.forEach(c => {
      const date = new Date(c.commit.author.date);
      const timestamp = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      const li = document.createElement('li');
      // Remove return characters and clean up commit message
      const cleanMessage = c.commit.message.replace(/[\r\n]/g, ' ').replace(/\s+/g, ' ').trim();
      li.textContent = `[${timestamp}] ${cleanMessage.slice(0, 60)}`;
      ul.appendChild(li);
    });

    feed.innerHTML = '';
    feed.appendChild(ul);
  } catch (err) {
    console.error(err);
    feed.textContent = 'Failed to load commits';
  }
})(); 

/* ---------- Idle Timeout Popup ---------- */
(function () {
  const idleTimeMs = 60 * 1000; // 1 minute
  let idleTimer;

  // Build and append popup markup
  const popupHTML = `
    <div class="idle-popup-overlay" id="idlePopup">
      <div class="idle-popup">
        <h2>🕹️ AFK DETECTED!</h2>
        <p>You have been inactive for 60 seconds.<br>Click <strong>CONTINUE</strong> to resume your quest.</p>
        <button id="idleContinueBtn">CONTINUE ▶</button>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', popupHTML);

  const overlay = document.getElementById('idlePopup');
  const continueBtn = document.getElementById('idleContinueBtn');

  function resetTimer() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(showPopup, idleTimeMs);
  }

  function showPopup() {
    overlay.classList.add('active');
  }

  if (continueBtn) {
    continueBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
      resetTimer();
    });
  }

  // Detect user activity to reset timer
  ['mousemove', 'keydown', 'scroll', 'touchstart'].forEach(evt => {
    document.addEventListener(evt, resetTimer, { passive: true });
  });

  // Initialize timer on load
  resetTimer();

  // Testing shortcut: Ctrl+Shift+P triggers popup immediately
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'P' || e.key === 'p')) {
      showPopup();
      // Prevent default browser print shortcut when popup is triggered intentionally
      e.preventDefault();
    }
  });
})();
