document.addEventListener("DOMContentLoaded", function() {
    // Mobile menu toggle
    const mobileMenuButton = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    mobileMenuButton.addEventListener('click', () => {
        mobileMenu.classList.toggle('hidden');
    });

    // Close mobile menu on link click
    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.add('hidden');
        });
    });

    // Intersection Observer for fade-in animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.2
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    const fadeElements = document.querySelectorAll('.fade-in-section');
    fadeElements.forEach(el => {
        observer.observe(el);
    });

    // Global scroll state to pause carousels during page scroll (prevents Safari mobile freeze)
    let isPageScrolling = false;
    let pageScrollTimeout;
    window.addEventListener('scroll', () => {
        isPageScrolling = true;
        clearTimeout(pageScrollTimeout);
        pageScrollTimeout = setTimeout(() => {
            isPageScrolling = false;
        }, 150);
    }, { passive: true });

    // Advanced Carousel Logic
    const carousels = document.querySelectorAll('.carousel-wrapper');
    
    carousels.forEach(wrapper => {
        const track = wrapper.querySelector('.carousel-track');
        const prevBtn = wrapper.querySelector('.carousel-prev');
        const nextBtn = wrapper.querySelector('.carousel-next');
        let isUserInteracting = false;
        let isVisible = false;
        let animationFrameId;

        // Slow steady continuous scroll
        const scrollStep = 1; // Pixels per frame
        
        // Intersection observer to only animate when visible
        const carouselObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                isVisible = entry.isIntersecting;
                if (isVisible && !animationFrameId && !isUserInteracting) {
                    animationFrameId = requestAnimationFrame(autoScroll);
                }
            });
        }, { root: null, threshold: 0.05 });
        
        carouselObserver.observe(wrapper);
        
        // To maintain an infinite loop without cloning nodes (which duplicates network requests),
        // we physically transfer the first DOM element to the end of the list when it scrolls fully 
        // out of view, and instantly bump the scroll position back by its width so it is invisible!
        
        const autoScroll = () => {
            if (!isUserInteracting && isVisible) {
                // Pause DOM manipulation and scroll updates if user is vertically scrolling the page
                if (!isPageScrolling) {
                    track.scrollLeft += scrollStep;
                    
                    const firstChild = track.firstElementChild;
                    if (firstChild && track.scrollLeft >= firstChild.offsetWidth) {
                        track.appendChild(firstChild);
                        track.scrollLeft -= firstChild.offsetWidth;
                    }
                }
                animationFrameId = requestAnimationFrame(autoScroll);
            } else {
                animationFrameId = null;
            }
        };

        const stopAutoScroll = () => {
            isUserInteracting = true;
        };

        // Circular scrolling logic for user swipe/wheel/clicks
        track.addEventListener('scroll', () => {
            if (isUserInteracting) {
                const firstChild = track.firstElementChild;
                const lastChild = track.lastElementChild;
                
                // Scrolling moving right
                if (firstChild && track.scrollLeft >= firstChild.offsetWidth) {
                    const behavior = track.style.scrollBehavior;
                    track.style.scrollBehavior = 'auto'; // Prevent transition glide on jump
                    
                    track.appendChild(firstChild);
                    track.scrollLeft -= firstChild.offsetWidth;
                    
                    track.style.scrollBehavior = behavior;
                }
                
                // Scrolling moving left
                if (lastChild && track.scrollLeft <= 0) {
                    const behavior = track.style.scrollBehavior;
                    track.style.scrollBehavior = 'auto';
                    
                    track.prepend(lastChild);
                    track.scrollLeft += lastChild.offsetWidth;
                    
                    track.style.scrollBehavior = behavior;
                }
            }
        });

        // Arrows - Custom Delta Animation
        let arrowAnimationId;
        const animateScrollBy = (distance, duration = 400) => {
            if (arrowAnimationId) cancelAnimationFrame(arrowAnimationId);
            const startTime = performance.now();
            let lastEasedValue = 0;

            const animate = (currentTime) => {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out cubic
                const easeOut = 1 - Math.pow(1 - progress, 3);
                const currentEasedValue = distance * easeOut;
                const delta = currentEasedValue - lastEasedValue;
                
                // Pre-emptively wrap, exactly like the mouse drag logic
                if (track.scrollLeft + delta <= 0) {
                    const lastChild = track.lastElementChild;
                    if (lastChild) {
                        track.style.scrollBehavior = 'auto';
                        track.prepend(lastChild);
                        track.scrollLeft += lastChild.offsetWidth;
                    }
                } else {
                    const firstChild = track.firstElementChild;
                    if (firstChild && track.scrollLeft + delta >= firstChild.offsetWidth) {
                        track.style.scrollBehavior = 'auto';
                        track.appendChild(firstChild);
                        track.scrollLeft -= firstChild.offsetWidth;
                    }
                }
                
                track.scrollLeft += delta;
                lastEasedValue = currentEasedValue;
                
                if (progress < 1) {
                    arrowAnimationId = requestAnimationFrame(animate);
                } else {
                    arrowAnimationId = null;
                }
            };
            arrowAnimationId = requestAnimationFrame(animate);
        };

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                stopAutoScroll();
                animateScrollBy(-350);
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                stopAutoScroll();
                animateScrollBy(350);
            });
        }

        // Mouse drag to scroll logic
        let isDragging = false;
        let lastX;

        // Prevent native image dragging which conflicts with our custom drag
        track.querySelectorAll('img, video').forEach(media => {
            media.addEventListener('dragstart', (e) => e.preventDefault());
        });

        track.style.cursor = 'grab';

        track.addEventListener('mousedown', (e) => {
            isDragging = true;
            track.style.cursor = 'grabbing';
            track.style.scrollBehavior = 'auto'; // Prevent transition lag
            lastX = e.pageX - track.offsetLeft;
            stopAutoScroll();
        });

        track.addEventListener('mouseleave', () => {
            isDragging = false;
            track.style.cursor = 'grab';
        });

        track.addEventListener('mouseup', () => {
            isDragging = false;
            track.style.cursor = 'grab';
        });

        track.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const currentX = e.pageX - track.offsetLeft;
            const delta = (lastX - currentX) * 1.5; // Scroll speed multiplier
            
            // Pre-emptively wrap if this drag would hit the boundaries, 
            // preventing the browser from capping scrollLeft and losing momentum.
            if (track.scrollLeft + delta <= 0) {
                const lastChild = track.lastElementChild;
                if (lastChild) {
                    track.style.scrollBehavior = 'auto';
                    track.prepend(lastChild);
                    track.scrollLeft += lastChild.offsetWidth;
                }
            } else {
                const firstChild = track.firstElementChild;
                if (firstChild && track.scrollLeft + delta >= firstChild.offsetWidth) {
                    track.style.scrollBehavior = 'auto';
                    track.appendChild(firstChild);
                    track.scrollLeft -= firstChild.offsetWidth;
                }
            }
            
            track.scrollLeft += delta;
            lastX = currentX;
        });

        // Other User interactions
        track.addEventListener('wheel', stopAutoScroll, { passive: true });
        track.addEventListener('touchstart', stopAutoScroll, { passive: true });
        
        // Pause when interacting with arrows
        if (prevBtn) prevBtn.addEventListener('mouseenter', stopAutoScroll);
        if (nextBtn) nextBtn.addEventListener('mouseenter', stopAutoScroll);
    });

    // Modals Logic
    const pdfModal = document.getElementById('pdfModal');
    const sheetModal = document.getElementById('sheetModal');
    const pdfModalContent = document.getElementById('pdfModalContent');
    const sheetModalContent = document.getElementById('sheetModalContent');
    const openPdfBtn = document.getElementById('open-pdf-btn');
    const closePdfBtn = document.getElementById('close-pdf-btn');
    const openSheetBtn = document.getElementById('open-sheet-btn');
    const closeSheetBtn = document.getElementById('close-sheet-btn');

    function openModal(modal, content) {
        if(!modal) return;
        modal.classList.remove('opacity-0', 'pointer-events-none');
        if(content) {
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        }
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal, content) {
        if(!modal) return;
        modal.classList.add('opacity-0', 'pointer-events-none');
        if(content) {
            content.classList.remove('scale-100');
            content.classList.add('scale-95');
        }
        document.body.style.overflow = '';
    }

    if(openPdfBtn) openPdfBtn.addEventListener('click', () => openModal(pdfModal, pdfModalContent));
    if(closePdfBtn) closePdfBtn.addEventListener('click', () => closeModal(pdfModal, pdfModalContent));
    if(openSheetBtn) openSheetBtn.addEventListener('click', () => openModal(sheetModal, sheetModalContent));
    if(closeSheetBtn) closeSheetBtn.addEventListener('click', () => closeModal(sheetModal, sheetModalContent));

    // Close modal on click outside (backdrop)
    window.addEventListener('click', (e) => {
        if (e.target === pdfModal) closeModal(pdfModal, pdfModalContent);
        if (e.target === sheetModal) closeModal(sheetModal, sheetModalContent);
    });

    // Video Intersection Observer for Smart Loading/Playing
    if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const video = entry.target;
                if (entry.isIntersecting) {
                    if (video.getAttribute('preload') === 'none') {
                        video.setAttribute('preload', 'auto');
                    }
                    video.play().catch(e => console.log('Autoplay prevented or interrupted', e));
                } else {
                    video.pause();
                }
            });
        }, { root: null, rootMargin: '200px', threshold: 0.05 });

        document.querySelectorAll('video').forEach(video => {
            videoObserver.observe(video);
        });
    }

    // Development Disclaimer Banner Logic
    const devDisclaimer = document.getElementById('dev-disclaimer');
    const dismissDisclaimerBtn = document.getElementById('dismiss-disclaimer');

    if (devDisclaimer && dismissDisclaimerBtn) {
        if (!localStorage.getItem('devDisclaimerDismissed')) {
            devDisclaimer.classList.remove('hidden');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    devDisclaimer.classList.remove('translate-y-full');
                });
            });
        }

        dismissDisclaimerBtn.addEventListener('click', () => {
            devDisclaimer.classList.add('translate-y-full');
            setTimeout(() => {
                devDisclaimer.classList.add('hidden');
            }, 300);
            localStorage.setItem('devDisclaimerDismissed', 'true');
        });
    }

    // Hero Section Parallax Effect
    const heroTextBehind = document.getElementById('hero-text-content-behind');
    const heroTextFront = document.getElementById('hero-text-content-front');
    const heroBg = document.getElementById('hero-bg');
    const heroFg = document.getElementById('hero-fg');

    if (heroBg && heroFg) {
        let ticking = false;

        window.addEventListener('scroll', () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    
                    // We want a deep vertical parallax effect:
                    // Text: translates down by 0.15, net movement UP is 0.85. (Moves fast)
                    const textTransform = `translate3d(0, ${scrollY * 0.15}px, 0)`;
                    if (heroTextBehind) heroTextBehind.style.transform = textTransform;
                    if (heroTextFront) heroTextFront.style.transform = textTransform;
                    
                    // Foreground: translates down by 0.45, net movement UP is 0.55. (Moves slower)
                    heroFg.style.transform = `translate3d(0, ${scrollY * 0.45}px, 0) scale(1.05)`;

                    // Background: translates down by 0.85, net movement UP is 0.15. (Moves slowest, deepest depth)
                    heroBg.style.transform = `translate3d(0, ${scrollY * 0.85}px, 0) scale(1.05)`;
                    
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }

    // Projects Section Parallax Effect
    const projectsHeroBg = document.getElementById('projects-hero-bg');
    const projectsHeroText = document.getElementById('projects-hero-text');

    if (projectsHeroBg && projectsHeroText) {
        let tickingProjects = false;

        window.addEventListener('scroll', () => {
            if (!tickingProjects) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    
                    // Subtle parallax for the projects header
                    // Move the text down slower than scroll speed
                    projectsHeroText.style.transform = `translate3d(0, ${scrollY * 0.25}px, 0)`;
                    
                    // Move the background blobs down slightly faster than the text to create depth
                    projectsHeroBg.style.transform = `translate3d(0, ${scrollY * 0.5}px, 0)`;
                    
                    tickingProjects = false;
                });
                tickingProjects = true;
            }
        }, { passive: true });
    }
});
