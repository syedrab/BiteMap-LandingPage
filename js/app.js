document.addEventListener('DOMContentLoaded', function() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    const primaryBtn = document.querySelector('.primary-btn');
    const featureCards = document.querySelectorAll('.feature-card');
    const phoneFloats = document.querySelectorAll('.phone-float');
    const emojiFloats = document.querySelectorAll('.emoji-float');
    const foodEmojis = document.querySelectorAll('.food-emoji');
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Parallax effect on scroll
    let ticking = false;
    function updateParallax() {
        const scrolled = window.pageYOffset;
        
        // Parallax for floating phones
        phoneFloats.forEach((phone, index) => {
            const speed = index === 0 ? 0.5 : 0.3;
            phone.style.transform = `translateY(${scrolled * speed}px) rotate(${index === 0 ? -15 : 15}deg)`;
        });
        
        // Parallax for emojis
        emojiFloats.forEach((emoji, index) => {
            const speed = 0.2 + (index * 0.1);
            emoji.style.transform = `translateY(${scrolled * speed}px) rotate(${scrolled * 0.5}deg)`;
        });
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            window.requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
    
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe feature cards
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        observer.observe(card);
    });
    
    // Mouse move effect for floating elements
    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        foodEmojis.forEach((emoji, index) => {
            const offsetX = (mouseX - 0.5) * 30 * (index + 1);
            const offsetY = (mouseY - 0.5) * 30 * (index + 1);
            emoji.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        });
    });
    
    // Handle email form submissions
    const emailForms = document.querySelectorAll('.email-form');
    emailForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('.email-input');
            const submitBtn = this.querySelector('.submit-btn');
            const email = emailInput.value;
            
            // Show success state
            submitBtn.textContent = 'Thanks! 🎉';
            submitBtn.style.background = 'var(--pink)';
            submitBtn.style.color = 'white';
            emailInput.value = '';
            emailInput.disabled = true;
            submitBtn.disabled = true;
            
            // Reset after 3 seconds
            setTimeout(() => {
                submitBtn.textContent = form.id === 'hero-email-form' ? 'Get Early Access' : 'Join Waitlist';
                submitBtn.style.background = 'var(--white)';
                submitBtn.style.color = 'var(--pink)';
                emailInput.disabled = false;
                submitBtn.disabled = false;
            }, 3000);
            
            // Here you would normally send the email to your backend
            console.log('Email submitted:', email);
        });
    });
    
    // Add CSS for fade-in animation
    const style = document.createElement('style');
    style.textContent = `
        .fade-in-up {
            animation: fadeInUp 0.8s ease forwards;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
    
    // Animate hero elements on load
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroCta = document.querySelector('.hero-cta');
    
    if (heroTitle) {
        heroTitle.style.opacity = '0';
        heroTitle.style.transform = 'translateY(50px)';
        setTimeout(() => {
            heroTitle.style.transition = 'all 1s ease';
            heroTitle.style.opacity = '1';
            heroTitle.style.transform = 'translateY(0)';
        }, 200);
    }
    
    if (heroSubtitle) {
        heroSubtitle.style.opacity = '0';
        setTimeout(() => {
            heroSubtitle.style.transition = 'opacity 1s ease';
            heroSubtitle.style.opacity = '0.9';
        }, 600);
    }
    
    if (heroCta) {
        heroCta.style.opacity = '0';
        heroCta.style.transform = 'translateY(30px)';
        setTimeout(() => {
            heroCta.style.transition = 'all 0.8s ease';
            heroCta.style.opacity = '1';
            heroCta.style.transform = 'translateY(0)';
        }, 1000);
    }
});