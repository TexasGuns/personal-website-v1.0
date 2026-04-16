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
        threshold: 0.1
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

    // Advanced Carousel Logic
    const carousels = document.querySelectorAll('.carousel-wrapper');
    
    carousels.forEach(wrapper => {
        const track = wrapper.querySelector('.carousel-track');
        const prevBtn = wrapper.querySelector('.carousel-prev');
        const nextBtn = wrapper.querySelector('.carousel-next');
        let isUserInteracting = false;
        let animationFrameId;

        // Slow steady continuous scroll
        const scrollStep = 1; // Pixels per frame
        
        // To maintain an infinite loop without cloning nodes (which duplicates network requests),
        // we physically transfer the first DOM element to the end of the list when it scrolls fully 
        // out of view, and instantly bump the scroll position back by its width so it is invisible!
        
        const autoScroll = () => {
            if (!isUserInteracting) {
                track.scrollLeft += scrollStep;
                
                const firstChild = track.firstElementChild;
                if (firstChild && track.scrollLeft >= firstChild.offsetWidth) {
                    track.appendChild(firstChild);
                    track.scrollLeft -= firstChild.offsetWidth;
                }
            }
            animationFrameId = requestAnimationFrame(autoScroll);
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

        // Arrows
        prevBtn.addEventListener('click', () => {
            stopAutoScroll();
            // Pre-shift backwards if we are at the edge, to ensure smoothScroll is uninterrupted
            if (track.scrollLeft < 100) {
                const lastChild = track.lastElementChild;
                const behavior = track.style.scrollBehavior;
                track.style.scrollBehavior = 'auto';
                track.prepend(lastChild);
                track.scrollLeft += lastChild.offsetWidth;
                track.style.scrollBehavior = behavior;
            }
            track.scrollBy({ left: -300, behavior: 'smooth' });
        });
        
        nextBtn.addEventListener('click', () => {
            stopAutoScroll();
            track.scrollBy({ left: 300, behavior: 'smooth' });
        });

        // User interactions (touch, drag, wheel)
        track.addEventListener('wheel', stopAutoScroll, { passive: true });
        track.addEventListener('touchstart', stopAutoScroll, { passive: true });
        track.addEventListener('mousedown', stopAutoScroll, { passive: true });
        
        // Pause when interacting with arrows
        prevBtn.addEventListener('mouseenter', stopAutoScroll);
        nextBtn.addEventListener('mouseenter', stopAutoScroll);

        // Start
        requestAnimationFrame(autoScroll);
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
});
