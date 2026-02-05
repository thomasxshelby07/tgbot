document.addEventListener('DOMContentLoaded', () => {

    // Navbar Scroll Effect
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile Menu
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileClose = document.getElementById('mobile-close');
    const mobileLinks = document.querySelectorAll('.mobile-link');

    function toggleMenu() {
        mobileMenu.classList.toggle('active');
    }

    mobileToggle.addEventListener('click', toggleMenu);
    mobileClose.addEventListener('click', toggleMenu);

    mobileLinks.forEach(link => {
        link.addEventListener('click', toggleMenu);
    });

    // Function to open Contact Form (Stub)
    function openContactForm() {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({
                behavior: 'smooth'
            });
            // Focus on first input for better UX
            setTimeout(() => {
                const firstInput = document.querySelector('#contactForm input');
                if (firstInput) firstInput.focus();
            }, 800);
        }
    }

    // Make explicit for global access if needed, or attach event listeners
    window.openContactForm = openContactForm;

    // Bento Accordion Logic (Mobile)
    window.toggleBento = function (element) {
        if (window.innerWidth <= 768) {
            // Check if already active
            const isActive = element.classList.contains('active');

            // Close all others
            document.querySelectorAll('.bento-card').forEach(card => {
                card.classList.remove('active');
            });

            // Toggle clicked
            if (!isActive) {
                element.classList.add('active');
            }
        }
    }

    // Scroll Animations (Intersection Observer)
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Add staggered animation to children if it's a grid
                if (entry.target.classList.contains('grid-3') || entry.target.classList.contains('grid-2')) {
                    const children = entry.target.children;
                    Array.from(children).forEach((child, index) => {
                        setTimeout(() => {
                            child.classList.add('visible');
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach(el => {
        observer.observe(el);
    });

    document.querySelectorAll('.card').forEach(card => observer.observe(card));



    // Contact Form Handling
    const form = document.getElementById('contactForm');
    const formStatus = document.getElementById('formStatus');
    const submitBtn = document.getElementById('submitBtn');

    async function handleSubmit(event) {
        event.preventDefault();
        const data = new FormData(event.target);

        // Simple client validation
        const phone = data.get('phone');
        if (phone.length < 10) {
            alert('Please enter a valid phone number');
            return;
        }

        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(event.target.action, {
                method: form.method,
                body: data,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                formStatus.style.display = 'block';
                form.reset();
                submitBtn.textContent = 'Message Sent';
                setTimeout(() => {
                    submitBtn.textContent = 'Send Message';
                    submitBtn.disabled = false;
                    formStatus.style.display = 'none';
                }, 5000);
            } else {
                const errorData = await response.json();
                alert('Oops! There was a problem submitting your form');
                submitBtn.textContent = 'Send Message';
                submitBtn.disabled = false;
            }
        } catch (error) {
            alert('Oops! There was a problem submitting your form');
            submitBtn.textContent = 'Send Message';
            submitBtn.disabled = false;
        }
    }

    form.addEventListener('submit', handleSubmit);

    // Accordion Logic (Who We Work With)
    window.toggleAccordion = function (element) {
        // If clicking the already active item, just toggle it
        if (element.classList.contains('active')) {
            element.classList.remove('active');
            return;
        }

        // Close all others
        const allItems = document.querySelectorAll('.accordion-item');
        allItems.forEach(item => {
            item.classList.remove('active');
        });

        // Open clicked
        element.classList.add('active');
    };

});
