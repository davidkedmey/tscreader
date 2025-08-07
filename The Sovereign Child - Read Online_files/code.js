// Global Bifocals object
let BF = {};

// Function to determine if an element is in viewport
function isInViewport(element) {
  const rect = element.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  let offsetTop = rect.top + window.scrollY;
  let offsetBottom = offsetTop + rect.height;
  const viewportTop = window.scrollY;
  const viewportBottom = viewportTop + viewportHeight;

  return (
    offsetTop <= viewportBottom &&
    offsetBottom >= viewportTop
  );
}




// Function to highlight current section in TOC and scroll it into view
function highlightCurrentSection() {
  // Get all section headings and paragraphs
  const sections = document.querySelectorAll('#col-1 .section');
  const paragraphs = document.querySelectorAll('#col-1 p[id^="p"]');
  const tocLinks = document.querySelectorAll('#toc a');
  const toc = document.querySelector('#toc');
  
  // Find the first visible section (skip short-toc when navigating to specific paragraphs)
  let currentSection = null;
  const isNavigatingToParagraph = window.location.hash.includes('-p') || window.location.hash.match(/^#p\d+$/);
  
  // Don't update hash if we're navigating to a specific paragraph
  if (isNavigatingToParagraph) {
    return;
  }
  
  for (const section of sections) {
    if (isInViewport(section)) {
      // Skip short-toc if we're navigating to a specific paragraph
      if (isNavigatingToParagraph && section.id === '_short-toc') {
        continue;
      }
      currentSection = section;
      break;
    }
  }

  // Find the most visible paragraph
  let currentParagraph = null;
  let maxVisibility = 0;
  
  for (const paragraph of paragraphs) {
    const rect = paragraph.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // Calculate how much of the paragraph is visible
    const visibleTop = Math.max(0, Math.min(rect.bottom, viewportHeight) - Math.max(rect.top, 0));
    const visibility = visibleTop / Math.min(rect.height, viewportHeight);
    
    if (visibility > maxVisibility && visibility > 0.3) { // At least 30% visible
      maxVisibility = visibility;
      currentParagraph = paragraph;
    }
  }

  // Update TOC highlights and scroll into view
  if (currentSection) {
    const h2 = currentSection.querySelector('h2');
    if (!h2 || !h2.id) {
      console.log('No h2 or h2.id found in currentSection:', currentSection);
      return;
    }
    const sectionId = h2.id;
    console.log('Current section ID:', sectionId);
    
    // Update URL with enhanced navigation (section + paragraph)
    let newHash = '#' + sectionId;
    if (currentParagraph && currentParagraph.id) {
      // Extract paragraph number from ID (e.g., "p15" -> "15")
      const paragraphNum = currentParagraph.id.replace('p', '');
      newHash = '#' + sectionId + '-p' + paragraphNum;
      console.log('Current paragraph ID:', currentParagraph.id);
      console.log('Enhanced hash:', newHash);
    }
    
    tocLinks.forEach(link => {
      if (link.getAttribute('href') === '#_' + sectionId) {
        link.closest('li').classList.add('current');
        // Scroll the TOC to show the current link
        const linkRect = link.getBoundingClientRect();
        const tocRect = toc.getBoundingClientRect();
        
        // Calculate if link is outside TOC viewport
        if (linkRect.top < tocRect.top || linkRect.bottom > tocRect.bottom) {
          // Scroll the link into view with some padding
          link.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        link.closest('li').classList.remove('current');
      }
    });
    
    // Change the # part of the URL to the current paragraph or section
    let hash = window.location.hash;
    console.log('Current hash:', hash, 'New hash:', newHash);
    
    // Only update URL if we're not already at the correct location
    if (hash !== newHash) {
      history.replaceState(null, '', newHash);
      console.log('Updated URL to:', newHash);
    }
    BF.currentSection = currentSection;
  }
}

// Add copy functionality to paragraph numbers
function addCopyLinksToParagraphs() {
  // This function is now handled by making the paragraph numbers clickable
  // See addParagraphNumbers() function below
}

// Setup keyboard navigation for paragraphs
function setupKeyboardNavigation() {
  const paragraphs = document.querySelectorAll('#col-1 p[id^="p"]');
  let currentParagraphIndex = 0;
  
  // Find current paragraph based on scroll position
  function updateCurrentParagraphIndex() {
    const viewportCenter = window.innerHeight / 2;
    for (let i = 0; i < paragraphs.length; i++) {
      const rect = paragraphs[i].getBoundingClientRect();
      if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
        currentParagraphIndex = i;
        break;
      }
    }
  }
  
  // Navigate to paragraph by index
  function navigateToParagraph(index) {
    if (index >= 0 && index < paragraphs.length) {
      paragraphs[index].scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      currentParagraphIndex = index;
    }
  }
  
  // Handle keyboard events
  document.addEventListener('keydown', function(e) {
    // Only handle if not typing in an input field
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    updateCurrentParagraphIndex();
    
    switch(e.key) {
      case 'ArrowUp':
        e.preventDefault();
        navigateToParagraph(currentParagraphIndex - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        navigateToParagraph(currentParagraphIndex + 1);
        break;
      case 'Home':
        e.preventDefault();
        navigateToParagraph(0);
        break;
      case 'End':
        e.preventDefault();
        navigateToParagraph(paragraphs.length - 1);
        break;
      case 'g':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const paragraphNum = prompt('Go to paragraph number:');
          if (paragraphNum && !isNaN(paragraphNum)) {
            const index = parseInt(paragraphNum) - 1;
            navigateToParagraph(index);
          }
        }
        break;
    }
  });
}

// Add paragraph numbers to the margin
function addParagraphNumbers() {
  const paragraphs = document.querySelectorAll('#col-1 p[id^="p"]');
  
  paragraphs.forEach((paragraph, index) => {
    // Extract paragraph number from ID
    const paragraphNum = paragraph.id.replace('p', '');
    
    // Create paragraph number element (now clickable)
    const numberElement = document.createElement('span');
    numberElement.className = 'paragraph-number';
    numberElement.textContent = paragraphNum;
    numberElement.title = `Click to copy link to paragraph ${paragraphNum}`;
    numberElement.style.cursor = 'pointer';
    
    // Add click handler to copy URL
    numberElement.addEventListener('click', function(e) {
      e.preventDefault();
      const url = window.location.origin + window.location.pathname + '#' + paragraph.id;
      navigator.clipboard.writeText(url).then(() => {
        // Show feedback
        const originalText = numberElement.textContent;
        const originalColor = numberElement.style.color;
        numberElement.textContent = '✓';
        numberElement.style.color = '#4CAF50';
        setTimeout(() => {
          numberElement.textContent = originalText;
          numberElement.style.color = originalColor;
        }, 1000);
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        const originalText = numberElement.textContent;
        const originalColor = numberElement.style.color;
        numberElement.textContent = '✓';
        numberElement.style.color = '#4CAF50';
        setTimeout(() => {
          numberElement.textContent = originalText;
          numberElement.style.color = originalColor;
        }, 1000);
      });
    });
    
    // Insert at the end of the paragraph (will be positioned absolutely)
    paragraph.appendChild(numberElement);
  });
}

// Add scroll event listener to the correct element
function setupScrollListener() {
  const col1 = document.querySelector('#col-1');
  console.log('Setting up scroll listeners. Found #col-1:', col1);
  
  // Use a more robust scroll detection method
  let ticking = false;
  
  function updateOnScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        console.log('Scroll detected - checking sections');
        highlightCurrentSection();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  // Listen on multiple elements to catch all possible scroll events
  const scrollElements = [
    window,
    document,
    document.documentElement,
    document.body,
    col1
  ].filter(Boolean);
  
  scrollElements.forEach(element => {
    console.log('Adding scroll listener to:', element);
    element.addEventListener('scroll', updateOnScroll, { passive: true });
  });
}


// // TAB KEY HANDLER
// // Add tab key handler to scroll focused element to center
// let lastFocusedElement = document.querySelector('#s1');
// document.addEventListener('keydown', function(e) {
//   if (e.key === 'Tab') {
//     // Wait for the default tab behavior to complete
//     setTimeout(() => {
//       // Get the currently focused element
//       const focusedElement = document.activeElement;
//       if (focusedElement && focusedElement.classList.contains('s')) {
//         lastFocusedElement = focusedElement;
//         console.log("lastFocusedElement", lastFocusedElement);
//         // Scroll the focused element to center of viewport
//         focusedElement.scrollIntoView({
//           behavior: 'smooth',
//           block: 'center'
//         });
//       } else if (lastFocusedElement) {
//         // If no current focus, use last focused element
//         lastFocusedElement.focus();
//         lastFocusedElement.scrollIntoView({
//           behavior: 'smooth', 
//           block: 'center'
//         });
//       }
//     }, 0);
//   }
// });

// Setup clickers for a specific column
function setupClickers(columnId) {
  const column = document.querySelector(columnId);
  // console.log("setupClickers", columnId, column);
  
  // H2 clicker
  // Add click handler to all h2s
  column.querySelectorAll('h2').forEach(h2 => {
    h2.addEventListener('click', () => {
      const section = h2.closest('.section');
      const chapter = h2.closest('.chapter');
      
      // Check if section is already at top of viewport
      const sectionRect = section.getBoundingClientRect();
      const isAtTop = Math.abs(sectionRect.top) < 50; // Allow small margin of error
      const jumpToContents = () => {
        // Only jump to contents if we're not trying to navigate to a specific paragraph
        if (!window.location.hash.includes('-p') && !window.location.hash.match(/^#p\d+$/)) {
          document.querySelector('#_short-toc').scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      };

      const instantSmooth = document.body.classList.contains('two-cols') ? 'instant' : 'smooth';

      // console.log({chapter, section});
      if(chapter) {
        if (isAtTop) {
          // Check if section follows an h1
          const prevH1 = section.previousElementSibling?.tagName === 'H1';
          
          if (prevH1) {
            // If section follows h1 and is at top
            jumpToContents();
          } else {
            // Otherwise scroll to chapter
            chapter.scrollIntoView({ behavior: instantSmooth, block: 'start' });
          }
        } else {
          // Otherwise scroll to section
          section.scrollIntoView({ behavior: instantSmooth, block: 'start' });
        }
      } else {
        jumpToContents();
      }
    });
  });

  // TOC clicker
  // Add click handler to TOC list items
  document.querySelectorAll(`#toc li, ${columnId} #_short-toc li`).forEach(li => {
    li.addEventListener('click', (e) => {
      // Only handle clicks directly on the li element, not its children
      if (e.target === li) {
        // Find the anchor element within this li
        const anchor = li.querySelector('a');
        anchor && anchor.click();
      }
    });
  });

  // SUMMARY clicker
  // Add click handler to summary divs
  column.querySelectorAll('.s').forEach(summary => {
    summary.addEventListener('click', (e) => {
      e.preventDefault();
      const container = summary.closest('.p');  
      const headerHeight = (window.innerHeight * 0.06);
      
      history.replaceState(null, '', '#' + summary.id);
      if (container) {
        if (document.body.classList.contains('two-cols')) {
          if (summary.closest('#left')) {
            document.documentElement.scrollTop = container.offsetTop - headerHeight;
          } else if (summary.closest('#right')) {
            document.querySelector('#col-2').scrollTop = container.offsetTop - headerHeight;
          }
        } else {
          window.scrollTo({
            top: container.offsetTop - headerHeight,
            behavior: 'smooth'
          });
        }
      }
    });
  });
}

// Handle URL hash - try both immediate and after DOM is ready
function handleHashNavigation() {
  if (window.location.hash) {
    const hash = window.location.hash;
    console.log('Loading hash:', hash);
    
    // Decode the hash to handle URL-encoded characters
    const decodedHash = decodeURIComponent(hash);
    console.log('Decoded hash:', decodedHash);
    
    // Try to find the element by ID attribute (for special characters like colons)
    let targetElement = null;
    const allElements = document.querySelectorAll('[id]');
    let targetId = decodedHash.substring(1); // Remove the # from the hash
    
    // Handle enhanced navigation format (e.g., "chapter-one-p15")
    if (targetId.includes('-p')) {
      const parts = targetId.split('-p');
      const sectionId = parts[0];
      const paragraphNum = parts[1];
      targetId = 'p' + paragraphNum;
      console.log('Enhanced navigation detected. Section:', sectionId, 'Paragraph:', targetId);
    }
    
    console.log('Looking for element with ID:', targetId);
    
    for (const element of allElements) {
      console.log('Checking element ID:', element.id);
      if (element.id === targetId) {
        targetElement = element;
        console.log('Found matching element:', element);
        break;
      }
    }
    
    if (targetElement) {
      console.log('Found target element:', targetElement);
      // Scroll to the target immediately
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      console.log('Scrolled to element');
      
      // Update meta tags for social media preview
      updateMetaTags(targetElement);
      
      return true; // Success
    } else {
      console.log('Target element not found for hash:', decodedHash);
      console.log('Available IDs:', Array.from(allElements).map(el => el.id).slice(0, 10)); // Show first 10 IDs for debugging
      return false; // Not found
    }
  }
  return false; // No hash
}

// Update meta tags for social media preview
function updateMetaTags(targetElement) {
  // Get the paragraph text (first 200 characters)
  const paragraphText = targetElement.textContent.trim();
  const previewText = paragraphText.length > 200 ? paragraphText.substring(0, 200) + '...' : paragraphText;
  
  // Get the section title
  const section = targetElement.closest('.section');
  const sectionTitle = section ? section.querySelector('h2')?.textContent || 'The Sovereign Child' : 'The Sovereign Child';
  
  // Update Open Graph meta tags
  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  const ogUrl = document.querySelector('meta[property="og:url"]');
  
  // Update Twitter meta tags
  const twitterTitle = document.querySelector('meta[property="twitter:title"]');
  const twitterDescription = document.querySelector('meta[property="twitter:description"]');
  const twitterUrl = document.querySelector('meta[property="twitter:url"]');
  
  // Update page title
  const pageTitle = document.querySelector('title');
  
  if (ogTitle) ogTitle.setAttribute('content', `${sectionTitle} - Paragraph ${targetElement.id.replace('p', '')}`);
  if (ogDescription) ogDescription.setAttribute('content', previewText);
  if (ogUrl) ogUrl.setAttribute('content', window.location.href);
  
  if (twitterTitle) twitterTitle.setAttribute('content', `${sectionTitle} - Paragraph ${targetElement.id.replace('p', '')}`);
  if (twitterDescription) twitterDescription.setAttribute('content', previewText);
  if (twitterUrl) twitterUrl.setAttribute('content', window.location.href);
  
  if (pageTitle) pageTitle.textContent = `${sectionTitle} - Paragraph ${targetElement.id.replace('p', '')}`;
  
  console.log('Updated meta tags for social media preview');
}

// Try immediately
if (!handleHashNavigation()) {
  // If immediate attempt failed, try again after DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
      handleHashNavigation();
    }, 100);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  // Initial highlight
  highlightCurrentSection();
  setupClickers('#col-1');
});

function checkScreenWidth() {
  // Get screen width and first paragraph width
  const screenWidth = window.innerWidth;
  const firstPara = document.querySelector('div.p');
  const isTwoCols = document.body.classList.contains('two-cols');
  if (firstPara && isTwoCols) {
    const paraWidth = firstPara.offsetWidth;
    if (screenWidth < paraWidth * 2) {
      // Screen too narrow for two columns
      // document.body.classList.remove('two-cols');
      console.log("Screen too narrow for two columns", screenWidth, paraWidth*2);
      document.getElementById('col-toggle-button').click();
      document.querySelector('dialog').show();
    } else {
      console.log("Screen is wide enough!", screenWidth, paraWidth*2);
    }
  }
}

// Function to create and position duplicate content
function setupTwoCols() {
    // Check if the class is already applied to body
  if ( document.getElementById('col-2')) {
    checkScreenWidth();
    return;
  }
  
  // it's better to use the documentElement so that we rely on scrolling the main document
  const col1 = document.documentElement;
  const col2 = document.querySelector('#col-1').cloneNode(true);

  col2.querySelectorAll('[id]').forEach(element => {
    element.id = `col2${element.id}`;
  });
  col2.id = 'col-2';
  let scrollDelta;
  
  // Insert into right div
  document.querySelector('#right').appendChild(col2);
  setupClickers('#col-2');
  
  // Function to update scrollDelta and set initial scroll position of col-2
  function updateScrollDelta() {
    // console.log("updateScrollDelta wtf");
    scrollDelta = Math.floor(window.innerHeight*(1-0.10)); // header & footer each take up 5% of the viewport
    col2.scrollTop = Math.floor( col1.scrollTop + scrollDelta );
  }
  updateScrollDelta();
  
  // Sync scrolling between the two divs
  let isScrolling = false;
  
  function syncScroll(primary, secondary, delta) {
    if (!isScrolling) {
      isScrolling = true;
      secondary.scrollTop = Math.round(primary.scrollTop + delta);
      isScrolling = false;
    }
  }
  
  // Persist col1's scrollTop and sync scroll on load
  const persistedScrollTop = localStorage.getItem('col1ScrollTop');
  if (persistedScrollTop) {
    col1.scrollTop = parseInt(persistedScrollTop);
    syncScroll(col1, col2, scrollDelta);
  }
  
  function shouldSync(current, target) {
    return Math.abs(current - Math.round(target)) > 5;
  }

  window.addEventListener('scroll', () => {
    // Enforce maximum scroll position for col1
    const maxScroll = col1.scrollHeight - window.innerHeight - scrollDelta;
    if (col1.scrollTop > maxScroll) {
      col1.scrollTop = maxScroll;
      return;
    }
    
    if (shouldSync(col2.scrollTop, col1.scrollTop + scrollDelta)) {
      syncScroll(col1, col2, scrollDelta);
    }
    localStorage.setItem('col1ScrollTop', col1.scrollTop);
  });
  
  col2.addEventListener('scroll', () => {
    // Enforce minimum scroll position for col2
    if (col2.scrollTop < scrollDelta) {
      col2.scrollTop = scrollDelta;
      return;
    }
    
    if (shouldSync(col1.scrollTop, col2.scrollTop - scrollDelta)) {
      syncScroll(col2, col1, -scrollDelta);
    }
  });

  // Add listener on window resize to refresh scrollDelta
  window.addEventListener('resize', () => {
    updateScrollDelta();
  });
  
  // Call updateScrollDelta initially to set the scroll position
  updateScrollDelta();
  checkScreenWidth();
}

// Get width of first paragraph in col-1 and apply to col-2 paragraphs via CSS
const setColWidth = () => {
  const firstCol1Para = document.querySelector('#col-1 p');
  if (firstCol1Para) {
    const width = firstCol1Para.offsetWidth;
    // console.log("setColWidth", width);
    document.documentElement.style.setProperty('--col2-para-width', width + 'px');
    document.head.insertAdjacentHTML('beforeend', 
      '<style>#col-2 p { width: var(--col2-para-width) !important; }</style>'
    );
    // // also set header & footer to this width in one line
    // document.documentElement.style.setProperty('--header-footer-width', (width + 50) + 'px');
    // document.head.insertAdjacentHTML('beforeend',
    //   '<style>.header, .footer { width: var(--header-footer-width) !important; }</style>'
    // );
  }
};

document.addEventListener('DOMContentLoaded', function() {
  // setColWidth();

  // Setup scroll listener
  setupScrollListener();
  
  // Add copy links to paragraphs
  addCopyLinksToParagraphs();
  
  // Setup keyboard navigation
  setupKeyboardNavigation();
  
  // Add paragraph numbers
  addParagraphNumbers();

  // Handle URL hash on page load - moved to end to avoid conflicts
  setTimeout(() => {
    if (window.location.hash) {
      const hash = window.location.hash;
      console.log('Loading hash:', hash);
      
      // Decode the hash to handle URL-encoded characters
      const decodedHash = decodeURIComponent(hash);
      console.log('Decoded hash:', decodedHash);
      
      // Try to find the element by ID attribute (for special characters like colons)
      let targetElement = null;
      const allElements = document.querySelectorAll('[id]');
      let targetId = decodedHash.substring(1); // Remove the # from the hash
      
      // Handle enhanced navigation format (e.g., "chapter-one-p15")
      if (targetId.includes('-p')) {
        const parts = targetId.split('-p');
        const sectionId = parts[0];
        const paragraphNum = parts[1];
        targetId = 'p' + paragraphNum;
        console.log('Enhanced navigation detected. Section:', sectionId, 'Paragraph:', targetId);
      }
      
      console.log('Looking for element with ID:', targetId);
      
      for (const element of allElements) {
        console.log('Checking element ID:', element.id);
        if (element.id === targetId) {
          targetElement = element;
          console.log('Found matching element:', element);
          break;
        }
      }
      
      if (targetElement) {
        console.log('Found target element:', targetElement);
        // Scroll to the target immediately
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        console.log('Scrolled to element');
      } else {
        console.log('Target element not found for hash:', decodedHash);
        console.log('Available IDs:', Array.from(allElements).map(el => el.id).slice(0, 10)); // Show first 10 IDs for debugging
      }
    }
  }, 0); // No delay - run immediately
  
  // Prevent any automatic hash changes
  window.addEventListener('hashchange', function(e) {
    console.log('Hash changed to:', window.location.hash);
    // Don't let the hash change automatically to short-toc
    if (window.location.hash === '#short-toc' && !e.isTrusted) {
      console.log('Preventing automatic redirect to short-toc');
      history.back();
    }
  });

  const tocToggleButton = document.getElementById('toc-toggle-button');
  tocToggleButton.addEventListener('click', function() {
    document.body.classList.toggle('open-toc');
    localStorage.setItem('openToc', document.body.classList.contains('open-toc'));
  });

  const colToggleButton = document.getElementById('col-toggle-button');
  colToggleButton.addEventListener('click', function() {
    document.body.classList.toggle('two-cols');
    setupTwoCols();
    localStorage.setItem('twoCols', document.body.classList.contains('two-cols'));
  });

  const darkToggleButton = document.getElementById('dark-toggle-button');
  darkToggleButton.addEventListener('click', function() {
    document.body.classList.toggle('dark');
    localStorage.setItem('darkMode', document.body.classList.contains('dark'));
  });

  // Restore the state of open-toc on load
  const openToc = localStorage.getItem('openToc');
  if (openToc === 'true') {
    document.body.classList.add('open-toc');
  }

  // Restore the state of one-col on load
  const twoCols = localStorage.getItem('twoCols');
  if (twoCols === 'true') {
    document.body.classList.add('two-cols');
    setupTwoCols();
  }

  // Restore the state of darkMode on load
  const darkMode = localStorage.getItem('darkMode');
  if (darkMode === 'true') {
    document.body.classList.add('dark');
  }
});

