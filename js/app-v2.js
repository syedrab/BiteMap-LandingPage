/**
 * BiteMap Landing Page V2
 * Animations and Interactions
 */

document.addEventListener('DOMContentLoaded', function() {
    // ============================================
    // NAVBAR SCROLL EFFECT
    // ============================================
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    function handleNavbarScroll() {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    }

    window.addEventListener('scroll', handleNavbarScroll, { passive: true });

    // ============================================
    // SMOOTH SCROLL FOR ANCHOR LINKS
    // ============================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const navbarHeight = navbar.offsetHeight;
                const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============================================
    // INTERSECTION OBSERVER FOR ANIMATIONS
    // ============================================
    const animatedElements = document.querySelectorAll('[data-animate]');

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered delay for grid items
                const parent = entry.target.parentElement;
                const siblings = parent ? Array.from(parent.querySelectorAll('[data-animate]')) : [];
                const siblingIndex = siblings.indexOf(entry.target);

                setTimeout(() => {
                    entry.target.classList.add('is-visible');
                }, siblingIndex * 100);

                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    animatedElements.forEach(el => observer.observe(el));

    // ============================================
    // HERO ANIMATIONS ON LOAD
    // ============================================
    function animateHero() {
        const heroContent = document.querySelector('.hero-content');
        const heroVisual = document.querySelector('.hero-visual');
        const heroTitle = document.querySelector('.hero-title');
        const heroBadge = document.querySelector('.hero-badge');
        const heroSubtitle = document.querySelector('.hero-subtitle');
        const heroCta = document.querySelector('.hero-cta');

        // Set initial states
        const elements = [heroBadge, heroTitle, heroSubtitle, heroCta];
        elements.forEach(el => {
            if (el) {
                el.style.opacity = '0';
                el.style.transform = 'translateY(30px)';
            }
        });

        if (heroVisual) {
            heroVisual.style.opacity = '0';
            heroVisual.style.transform = 'scale(0.95)';
        }

        // Animate in sequence
        setTimeout(() => {
            if (heroBadge) {
                heroBadge.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                heroBadge.style.opacity = '1';
                heroBadge.style.transform = 'translateY(0)';
            }
        }, 100);

        setTimeout(() => {
            if (heroTitle) {
                heroTitle.style.transition = 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)';
                heroTitle.style.opacity = '1';
                heroTitle.style.transform = 'translateY(0)';
            }
        }, 200);

        setTimeout(() => {
            if (heroSubtitle) {
                heroSubtitle.style.transition = 'all 0.6s ease';
                heroSubtitle.style.opacity = '1';
                heroSubtitle.style.transform = 'translateY(0)';
            }
        }, 400);

        setTimeout(() => {
            if (heroCta) {
                heroCta.style.transition = 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
                heroCta.style.opacity = '1';
                heroCta.style.transform = 'translateY(0)';
            }
        }, 500);

        setTimeout(() => {
            if (heroVisual) {
                heroVisual.style.transition = 'all 1s cubic-bezier(0.34, 1.56, 0.64, 1)';
                heroVisual.style.opacity = '1';
                heroVisual.style.transform = 'scale(1)';
            }
        }, 300);
    }

    // Run hero animation after a brief delay
    setTimeout(animateHero, 100);

    // ============================================
    // CREATOR ORBIT HOVER EFFECTS
    // ============================================
    const orbitCreators = document.querySelectorAll('.orbit-creator');

    orbitCreators.forEach(creator => {
        creator.addEventListener('mouseenter', function() {
            // Pause orbit rotation
            const orbit = this.closest('.orbit');
            if (orbit) {
                orbit.style.animationPlayState = 'paused';
            }
        });

        creator.addEventListener('mouseleave', function() {
            // Resume orbit rotation
            const orbit = this.closest('.orbit');
            if (orbit) {
                orbit.style.animationPlayState = 'running';
            }
        });
    });

    // ============================================
    // PHONE MOCKUP PARALLAX
    // ============================================
    const heroPhone = document.querySelector('.hero-phone');
    let ticking = false;

    function updatePhoneParallax() {
        if (!heroPhone) return;

        const scrolled = window.pageYOffset;
        const heroSection = document.querySelector('.hero');
        const heroHeight = heroSection ? heroSection.offsetHeight : 800;

        if (scrolled < heroHeight) {
            const parallaxValue = scrolled * 0.15;
            heroPhone.style.transform = `translateY(${parallaxValue}px)`;
        }

        ticking = false;
    }

    function requestPhoneTick() {
        if (!ticking) {
            requestAnimationFrame(updatePhoneParallax);
            ticking = true;
        }
    }

    window.addEventListener('scroll', requestPhoneTick, { passive: true });

    // ============================================
    // BUTTON RIPPLE EFFECT
    // ============================================
    const buttons = document.querySelectorAll('.btn-primary, .btn-appstore');

    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');

            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.4);
                transform: scale(0);
                animation: ripple 0.6s ease-out;
                pointer-events: none;
            `;

            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
            ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';

            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation to document
    const rippleStyle = document.createElement('style');
    rippleStyle.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(rippleStyle);

    // ============================================
    // HOW-IT-WORKS STEP ANIMATIONS
    // ============================================
    const howSteps = document.querySelectorAll('.how-step');

    howSteps.forEach((step, index) => {
        step.style.transitionDelay = `${index * 0.15}s`;
    });

    // ============================================
    // CREATOR CARDS STAGGER
    // ============================================
    const creatorCards = document.querySelectorAll('.creator-card');

    const creatorObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                const cards = document.querySelectorAll('.creator-card');
                const cardIndex = Array.from(cards).indexOf(entry.target);

                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, cardIndex * 50);

                creatorObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    creatorCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
        creatorObserver.observe(card);
    });

    // ============================================
    // SCROLL-TRIGGERED NUMBER COUNTER
    // ============================================
    function animateNumber(element, target, duration = 1500) {
        let start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * target);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = target.toLocaleString();
            }
        }

        requestAnimationFrame(update);
    }

    // ============================================
    // PREFERS REDUCED MOTION
    // ============================================
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    if (prefersReducedMotion.matches) {
        // Disable animations for users who prefer reduced motion
        document.documentElement.style.setProperty('--transition-base', '0ms');
        document.documentElement.style.setProperty('--transition-slow', '0ms');

        // Make all animated elements visible immediately
        document.querySelectorAll('[data-animate]').forEach(el => {
            el.classList.add('is-visible');
        });

        // Stop orbit animations
        document.querySelectorAll('.orbit').forEach(orbit => {
            orbit.style.animation = 'none';
        });
    }

    // ============================================
    // CONSOLE EASTER EGG
    // ============================================
    console.log('%c🍔 BiteMap', 'font-size: 24px; font-weight: bold; color: #FF6B00;');
    console.log('%cFind your next spot through people you trust', 'font-size: 14px; color: #9B9894;');
    console.log('%chttps://apps.apple.com/us/app/bitemap/id6746139076', 'font-size: 12px; color: #FF6B00;');
});
