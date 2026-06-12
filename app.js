document.addEventListener('DOMContentLoaded', () => {
  // Mobile Menu Toggle
  const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  
  if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('mobile-active');
      const icon = mobileMenuBtn.querySelector('i');
      if (navLinks.classList.contains('mobile-active')) {
        icon.className = 'fas fa-times';
      } else {
        icon.className = 'fas fa-bars';
      }
    });
    
    // Close mobile menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('mobile-active');
        mobileMenuBtn.querySelector('i').className = 'fas fa-bars';
      });
    });
  }

  // State Variables
  let characterData = [];
  let currentSlideIndex = 0;

  // Cache slider elements
  const charButtonsContainer = document.getElementById('char-buttons-list');
  const sliderTrack = document.getElementById('slider-track');
  const sliderDotsContainer = document.getElementById('slider-dots-container');
  const prevBtn = document.getElementById('slider-prev');
  const nextBtn = document.getElementById('slider-next');

  /* ==========================================
     VIDEO URL DETECTOR & EMBED GENERATOR
     ========================================== */
  function getEmbedVideoHTML(url) {
    if (!url) return '';
    url = url.trim();

    // 1. YouTube Match
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      return `<iframe src="https://www.youtube.com/embed/${videoId}?enablejsapi=1&rel=0" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%; height:100%;"></iframe>`;
    }

    // 2. Google Drive Match
    if (url.includes('drive.google.com')) {
      let driveId = '';
      const driveDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (driveDMatch && driveDMatch[1]) {
        driveId = driveDMatch[1];
      } else {
        const driveIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (driveIdMatch && driveIdMatch[1]) {
          driveId = driveIdMatch[1];
        }
      }
      if (driveId) {
        return `<iframe src="https://drive.google.com/file/d/${driveId}/preview" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; height:100%;"></iframe>`;
      }
    }

    // 3. TikTok Match
    if (url.includes('tiktok.com')) {
      const tiktokMatch = url.match(/\/video\/(\d+)/);
      if (tiktokMatch && tiktokMatch[1]) {
        const videoId = tiktokMatch[1];
        return `<iframe src="https://www.tiktok.com/embed/v2/${videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="width:100%; height:100%;"></iframe>`;
      }
    }

    // 4. Facebook Match
    if (url.includes('facebook.com') || url.includes('fb.watch')) {
      if (url.includes('/share/v/') || url.includes('/share/r/') || url.includes('/share/')) {
        return `
          <div class="fb-share-fallback">
            <div class="fb-fallback-icon">
              <i class="fab fa-facebook"></i>
            </div>
            <h4>วิดีโอนี้เป็นลิงก์แชร์จาก Facebook</h4>
            <p>ไม่สามารถเปิดเล่นในเว็บได้โดยตรงเนื่องจากข้อจำกัดของ Facebook</p>
            <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn-fb-fallback">
              <i class="fab fa-facebook"></i> รับชมบน Facebook
            </a>
          </div>
        `;
      }
      const encodedUrl = encodeURIComponent(url);
      return `<iframe src="https://www.facebook.com/plugins/video.php?href=${encodedUrl}&show_text=0&width=560" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share" allowfullscreen style="width:100%; height:100%;"></iframe>`;
    }

    // 5. Fallback/Direct MP4 File
    return `
      <video src="${url}" preload="metadata" playsinline loop style="width:100%; height:100%; object-fit:cover;"></video>
      <div class="video-play-overlay">
        <i class="fas fa-play"></i>
      </div>
      <button class="video-overlay-btn mute-btn-video" aria-label="Mute/Unmute Video">
        <i class="fas fa-volume-mute"></i>
      </button>
    `;
  }

  /* ==========================================
     CAROUSEL CONTROLLER
     ========================================== */
  function renderSlider(cards) {
    // Render Character Selection Tabs
    charButtonsContainer.innerHTML = '';
    cards.forEach((card, index) => {
      const btn = document.createElement('button');
      btn.className = `char-tab-btn ${index === 0 ? 'active' : ''}`;
      btn.dataset.index = index;
      btn.innerHTML = `
        <img src="${card.avatar}" alt="${card.name}">
        <span>${card.name}</span>
      `;
      btn.addEventListener('click', () => {
        goToSlide(index);
      });
      charButtonsContainer.appendChild(btn);
    });

    // Render Slider Tracks
    sliderTrack.innerHTML = '';
    cards.forEach((card) => {
      const slide = document.createElement('div');
      slide.className = 'slider-card';
      
      const videoHTML = getEmbedVideoHTML(card.video);
      
      slide.innerHTML = `
        <div class="card-video-container">
          ${videoHTML}
        </div>
        <div class="card-profile">
          <img src="${card.avatar}" alt="${card.name}" class="profile-avatar">
          <div class="profile-title-group">
            <h3>${card.name}</h3>
            <span class="profile-badge">${card.type}</span>
          </div>
        </div>
      `;
      sliderTrack.appendChild(slide);
    });

    // Render Dots
    sliderDotsContainer.innerHTML = '';
    cards.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.className = `slider-dot ${index === 0 ? 'active' : ''}`;
      dot.dataset.index = index;
      dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
      dot.addEventListener('click', () => {
        goToSlide(index);
      });
      sliderDotsContainer.appendChild(dot);
    });

    // Setup Direct Video Controls (for fallback local/direct MP4 files)
    setupDirectVideoControls();
  }

  function setupDirectVideoControls() {
    const videoContainers = document.querySelectorAll('.card-video-container');
    videoContainers.forEach(container => {
      const video = container.querySelector('video');
      const playOverlay = container.querySelector('.video-play-overlay');
      const muteBtn = container.querySelector('.mute-btn-video');

      if (!video) return; // Skip if iframe

      // Play/pause toggle on container click
      const togglePlay = () => {
        stopAllMedia(); // Pause everything else first!
        if (video.paused) {
          video.play();
          container.classList.add('playing');
        } else {
          video.pause();
          container.classList.remove('playing');
        }
      };

      playOverlay.addEventListener('click', togglePlay);
      video.addEventListener('click', togglePlay);

      // Mute/unmute toggle
      if (muteBtn) {
        muteBtn.addEventListener('click', (e) => {
          e.stopPropagation(); // Don't trigger play/pause
          video.muted = !video.muted;
          const icon = muteBtn.querySelector('i');
          if (video.muted) {
            icon.className = 'fas fa-volume-mute';
          } else {
            icon.className = 'fas fa-volume-up';
          }
        });
      }
    });
  }

  function goToSlide(index) {
    if (index < 0 || index >= characterData.length) return;
    
    // Stop playing media in the old slide
    resetInactiveSlides(currentSlideIndex);

    currentSlideIndex = index;
    
    // Slide transition
    sliderTrack.style.transform = `translateX(-${currentSlideIndex * 100}%)`;
    
    // Update active tab button
    const tabBtns = document.querySelectorAll('.char-tab-btn');
    tabBtns.forEach((btn, idx) => {
      if (idx === currentSlideIndex) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update dots
    const dots = document.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlideIndex);
    });
  }

  // Re-load iframes to stop playback and stop direct HTML5 videos
  function resetInactiveSlides(oldIndex) {
    const slides = document.querySelectorAll('.slider-card');
    if (slides[oldIndex]) {
      // 1. Direct Video reset
      const video = slides[oldIndex].querySelector('video');
      if (video) {
        video.pause();
        slides[oldIndex].querySelector('.card-video-container').classList.remove('playing');
      }

      // 2. Iframe reset (force reload the iframe to kill background audio/playback)
      const iframe = slides[oldIndex].querySelector('iframe');
      if (iframe) {
        const src = iframe.src;
        iframe.src = '';
        iframe.src = src;
      }
    }
  }

  // Navigation Arrows
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      let prevIndex = currentSlideIndex - 1;
      if (prevIndex < 0) prevIndex = characterData.length - 1;
      goToSlide(prevIndex);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      let nextIndex = currentSlideIndex + 1;
      if (nextIndex >= characterData.length) nextIndex = 0;
      goToSlide(nextIndex);
    });
  }

  // Touch Swipe Support for Mobile Carousel
  const sliderViewport = document.getElementById('slider-viewport');
  let touchStartX = 0;
  let touchEndX = 0;

  if (sliderViewport) {
    sliderViewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    sliderViewport.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipeGesture();
    }, { passive: true });
  }

  function handleSwipeGesture() {
    const swipeThreshold = 50; // minimum pixels to detect swipe
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        // Swiped left -> Next card
        let nextIndex = currentSlideIndex + 1;
        if (nextIndex >= characterData.length) nextIndex = 0;
        goToSlide(nextIndex);
      } else {
        // Swiped right -> Prev card
        let prevIndex = currentSlideIndex - 1;
        if (prevIndex < 0) prevIndex = characterData.length - 1;
        goToSlide(prevIndex);
      }
    }
  }

  // Stop all active media (direct videos and iframe reloads)
  function stopAllMedia() {
    // Pause slider direct HTML5 videos
    document.querySelectorAll('.card-video-container video').forEach(vid => {
      if (!vid.paused) {
        vid.pause();
        vid.closest('.card-video-container').classList.remove('playing');
      }
    });

    // Reset current/inactive slide iframes to stop playback
    resetInactiveSlides(currentSlideIndex);
  }

  /* ==========================================
     REVIEWS RENDERING & LIGHTBOX
     ========================================== */
  const reviewsContainer = document.getElementById('reviews-container');

  function renderReviews(reviews) {
    if (!reviewsContainer) return;
    reviewsContainer.innerHTML = '';
    
    reviews.forEach(review => {
      const card = document.createElement('div');
      card.className = 'review-card';
 
      card.innerHTML = `
        <div class="review-image-wrapper">
          <img src="${review.reviewImage}" alt="Review" loading="lazy">
        </div>
      `;
      
      const imgWrapper = card.querySelector('.review-image-wrapper');
      if (imgWrapper) {
        imgWrapper.addEventListener('click', () => {
          openLightbox(review.reviewImage);
        });
      }
      
      reviewsContainer.appendChild(card);
    });
  }

  function openLightbox(imgSrc) {
    let lightbox = document.getElementById('lightbox-modal');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.id = 'lightbox-modal';
      lightbox.className = 'lightbox-modal';
      lightbox.innerHTML = `
        <span class="lightbox-close">&times;</span>
        <div class="lightbox-content">
          <img id="lightbox-img" src="" alt="Enlarged Review">
        </div>
      `;
      document.body.appendChild(lightbox);
      
      lightbox.addEventListener('click', (e) => {
        if (e.target.id === 'lightbox-modal' || e.target.classList.contains('lightbox-close')) {
          lightbox.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    }
    
    const lightboxImg = lightbox.querySelector('#lightbox-img');
    if (lightboxImg) {
      lightboxImg.src = imgSrc;
    }
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /* ==========================================
     SCROLLSPY NAVBAR ACTIVE LINKS
     ========================================== */
  const sections = document.querySelectorAll('section[id]');
  const navItems = document.querySelectorAll('.nav-links a:not(.btn-contact-nav)');

  if (sections.length > 0 && navItems.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-30% 0px -60% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navItems.forEach(item => {
            if (item.getAttribute('href') === `#${id}`) {
              item.classList.add('active');
            } else {
              item.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));
  }

  /* ==========================================
     DISCORD ID COPY CLIPBOARD
     ========================================== */
  const discordCopyBtn = document.getElementById('discord-copy-btn');
  if (discordCopyBtn) {
    discordCopyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const discordId = 'mt_dt';
      navigator.clipboard.writeText(discordId).then(() => {
        const span = discordCopyBtn.querySelector('.btn-text span');
        if (span) {
          const originalText = span.textContent;
          span.textContent = 'คัดลอกสำเร็จแล้ว!';
          span.style.color = '#10b981'; // Green accent
          
          setTimeout(() => {
            span.textContent = originalText;
            span.style.color = '';
          }, 2000);
        }
      }).catch(err => {
        console.error('Could not copy Discord ID: ', err);
      });
    });
  }

  /* ==========================================
     INITIAL FETCH & POPULATE
     ========================================== */
  async function init() {
    try {
      // Load Cards Data
      const cardsResponse = await fetch('cards.json');
      if (cardsResponse.ok) {
        characterData = await cardsResponse.json();
        renderSlider(characterData);
      } else {
        console.error('Failed to load cards.json');
      }

      // Load Reviews Data
      const reviewsResponse = await fetch('reviews.json');
      if (reviewsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        renderReviews(reviewsData);
      } else {
        console.error('Failed to load reviews.json');
      }
    } catch (err) {
      console.error('Error initializing data: ', err);
    }
  }

  init();
});
