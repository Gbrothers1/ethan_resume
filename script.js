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

/* ---------- Typing effect with auto-scroll ---------- */
let typingStarted = false;

function typeText(element, text, speed = 15) {
  let idx = 0;
  function type() {
    if (idx < text.length) {
      element.textContent += text.charAt(idx);
      idx++;
      // Auto scroll the surrounding content area so the newest text is always visible
      const contentArea = document.getElementById('content-area');
      if (contentArea) {
        contentArea.scrollTop = contentArea.scrollHeight;
      }
      setTimeout(type, speed);
    }
  }
  type();
}

function startTypingEffect() {
  if (typingStarted) return; // Only run once per page load
  typingStarted = true;

  // Locate the cover-letter content block (first .content-text after #cover-letter header)
  const coverHeader = document.getElementById('cover-letter');
  if (!coverHeader) return;
  const coverTextEl = coverHeader.nextElementSibling;
  if (!coverTextEl || !coverTextEl.classList.contains('content-text')) return;

  const originalText = coverTextEl.textContent.trim();
  coverTextEl.textContent = ""; // Clear existing text before typing
  typeText(coverTextEl, originalText, 15);
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
  // Start typing effect with auto-scroll once the cover letter is visible
  startTypingEffect();

    // Print button – generate printout without changing page
  const printBtn = document.getElementById('printBtn');
  if (printBtn) {
    printBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      
      // Build the complete HTML content
      let printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ethan Gordon - Resume</title>
          <style>
            @page {
              size: letter;
              margin: 0.75in;
            }
            
            @media print {
              @page {
                margin: 0.75in;
                /* Disable headers and footers */
                @top-left { content: none; }
                @top-center { content: none; }
                @top-right { content: none; }
                @bottom-left { content: none; }
                @bottom-center { content: none; }
                @bottom-right { content: none; }
              }
            }
            
            body {
              margin: 0;
              padding: 0;
              background: #fff;
              color: #000;
              font-size: 11pt;
              font-family: 'Times New Roman', serif;
              line-height: 1.3;
            }
            
            .print-title {
              font-size: 16pt;
              font-weight: bold;
              margin-bottom: 6pt;
              text-align: center;
            }
            
            .print-subtitle {
              font-size: 12pt;
              margin-bottom: 12pt;
              text-align: center;
            }
            
            .print-contact {
              margin-bottom: 4pt;
              text-align: center;
            }
            
            .print-section-header {
              font-weight: bold;
              font-size: 13pt;
              margin-top: 18pt;
              margin-bottom: 8pt;
              text-decoration: underline;
              text-transform: uppercase;
              page-break-after: avoid;
            }
            
            .print-section-header:first-of-type {
              margin-top: 12pt;
            }
            
            .print-content {
              margin-bottom: 12pt;
              line-height: 1.4;
            }
            
            .print-skills {
              margin-bottom: 4pt;
            }
            
            .print-project {
              margin-bottom: 3pt;
            }
            
            .print-commits {
              background: #f9f9f9;
              border: 1pt solid #ccc;
              padding: 6pt;
              font-size: 9pt;
              margin-top: 6pt;
            }
            
            .print-commits ul {
              margin: 0;
              padding-left: 12pt;
              list-style-type: disc;
            }
            
            .print-commits li {
              margin-bottom: 2pt;
              font-size: 9pt;
              line-height: 1.2;
            }
          </style>
        </head>
        <body>
      `;
      
      // Add header
      const title = document.querySelector('.title');
      const subtitle = title ? title.nextElementSibling : null;
      
      if (title) {
        printHTML += `<div class="print-title">${title.textContent}</div>`;
      }
      if (subtitle) {
        printHTML += `<div class="print-subtitle">${subtitle.textContent}</div>`;
      }
      
      // Add contact info - extract location, relocation, and email
      const resumeContent = document.getElementById('resume-content');
      const textContent = resumeContent.textContent;
      
      // Extract location info
      const locationMatch = textContent.match(/LOCATION:\s*([^R]+)RELOCATION:\s*([^E]+)EMAIL:\s*([^\n]+)/);
      if (locationMatch) {
        printHTML += `<div class="print-contact"><strong>LOCATION:</strong> ${locationMatch[1].trim()}</div>`;
        printHTML += `<div class="print-contact"><strong>RELOCATION:</strong> ${locationMatch[2].trim()}</div>`;
        printHTML += `<div class="print-contact"><strong>EMAIL:</strong> ${locationMatch[3].trim()}</div>`;
      } else {
        // Fallback - find email link
        const emailLink = document.querySelector('#resume-content a[href^="mailto:"]');
        if (emailLink) {
          printHTML += `<div class="print-contact"><strong>EMAIL:</strong> ${emailLink.textContent}</div>`;
        }
      }
      
      printHTML += '<div style="height: 20pt;"></div>';
      
      // Add all sections (excluding GitHub)
      const sectionsData = [
        { id: 'cover-letter', title: 'COVER LETTER' },
        { id: 'summary', title: 'SUMMARY' },
        { id: 'core-skills', title: 'CORE SKILLS' },
        { id: 'projects', title: 'SELECTED PROJECTS' },
        { id: 'experience', title: 'EXPERIENCE' },
        { id: 'education', title: 'EDUCATION' },
        { id: 'additional', title: 'ADDITIONAL' }
      ];
      
      sectionsData.forEach(section => {
        printHTML += `<div class="print-section-header">${section.title}</div>`;
        
        const sectionEl = document.getElementById(section.id);
        if (sectionEl) {
          let nextElement = sectionEl.nextElementSibling;
          while (nextElement && !nextElement.classList.contains('section')) {
            if (nextElement.classList.contains('content-text')) {
              printHTML += `<div class="print-content">${nextElement.innerHTML}</div>`;
            } else if (nextElement.classList.contains('skills-grid')) {
              printHTML += '<div class="print-content">';
              const skills = nextElement.querySelectorAll('.skill-category');
              skills.forEach(skill => {
                printHTML += `<div class="print-skills">${skill.textContent}</div>`;
              });
              printHTML += '</div>';
            } else if (nextElement.classList.contains('projects-list')) {
              printHTML += '<div class="print-content">';
              const projects = nextElement.querySelectorAll('.project-item');
              projects.forEach(project => {
                printHTML += `<div class="print-project">${project.textContent}</div>`;
              });
              printHTML += '</div>';
            } else if (nextElement.classList.contains('github-box')) {
              printHTML += '<div class="print-content">';
              const commitFeed = nextElement.querySelector('#commitFeed');
              if (commitFeed) {
                printHTML += `<div class="print-commits">${commitFeed.innerHTML}</div>`;
              }
              printHTML += '</div>';
            }
            nextElement = nextElement.nextElementSibling;
          }
        }
      });
      
      printHTML += '</body></html>';
      
      // Write content to new window and print
      printWindow.document.write(printHTML);
      printWindow.document.close();
      
      // Wait for content to load, then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
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