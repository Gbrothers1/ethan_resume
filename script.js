/* ---------- Navigation functionality ---------- */
function showSection(sectionId) {
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
}

// Initialize navigation
document.addEventListener('DOMContentLoaded', function() {
  // Add click and touch handlers to navigation buttons for mobile support
  const navButtons = document.querySelectorAll('.nav a');
  navButtons.forEach(button => {
    const handleNavigation = function(e) {
      e.preventDefault();
      const sectionId = this.getAttribute('href').substring(1);
      showSection(sectionId);
    };
    
    // Add both click and touch events for better mobile support
    button.addEventListener('click', handleNavigation);
    button.addEventListener('touchend', handleNavigation);
    
    // Prevent double-tap zoom on mobile navigation
    button.addEventListener('touchstart', function(e) {
      e.preventDefault();
    });
  });
  
  // Show only cover letter on first load
  showSection('cover-letter');
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