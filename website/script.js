document.addEventListener('DOMContentLoaded', () => {
    // Supabase Configuration
    const SUPABASE_URL = 'https://ugsshfjttrtohpfrggma.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVnc3NoZmp0dHJ0b2hwZnJnZ21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4OTg2MzMsImV4cCI6MjA4MjQ3NDYzM30.--bDORFIFgh1hLDceEgJlvX9wNR_p4kldv4QxIBh2C4';
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Navbar background change on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 10, 0.95)';
            navbar.style.padding = '16px 0';
        } else {
            navbar.style.background = 'rgba(10, 10, 10, 0.8)';
            navbar.style.padding = '24px 0';
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('menu-toggle');
    const navLinks = document.getElementById('nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links a');

    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navLinks.classList.toggle('active');
            const icon = menuToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.setAttribute('data-lucide', 'x');
            } else {
                icon.setAttribute('data-lucide', 'menu');
            }
            lucide.createIcons();
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            }
        });

        // Close menu when clicking a link
        navLinksItems.forEach(item => {
            item.addEventListener('click', () => {
                navLinks.classList.remove('active');
                menuToggle.querySelector('i').setAttribute('data-lucide', 'menu');
                lucide.createIcons();
            });
        });
    }

    // Fetch and Render Plans from Supabase
    async function fetchPlans() {
        const container = document.getElementById('pricing-container');
        try {
            const { data: plans, error } = await supabaseClient
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('price');

            if (error) throw error;

            container.innerHTML = ''; // Clear loading state

            plans.forEach(plan => {
                const isPopular = plan.plan_type === 'weekly';
                const card = document.createElement('div');
                card.className = `pricing-card ${isPopular ? 'popular' : ''}`;
                
                const duration = plan.duration_hours < 24 ? `${plan.duration_hours}h` : `${plan.duration_hours / 24}d`;
                const features = [
                    plan.access_type === 'all_courses' ? 'All Subjects Access' : 'Single Subject Access',
                    'Interactive Quizzes',
                    'Progress Tracking',
                    'Mobile Money Ready'
                ];

                card.innerHTML = `
                    ${isPopular ? '<div class="popular-badge">Best Value</div>' : ''}
                    <div class="pricing-header">
                        <h3>${plan.name}</h3>
                        <div class="price">${plan.price.toLocaleString()} <span>RWF</span></div>
                        <p style="font-size: 0.9rem; opacity: 0.7;">Valid for ${duration}</p>
                    </div>
                    <ul class="features">
                        ${features.map(f => `<li><i data-lucide="check"></i> ${f}</li>`).join('')}
                    </ul>
                    <a href="#" class="btn-primary" style="width: 100%; text-align: center;">Choose Plan</a>
                `;
                container.appendChild(card);
            });
            
            // Re-initialize Lucide icons for new elements
            lucide.createIcons();
            
            // Apply observer to new cards
            const newCards = container.querySelectorAll('.pricing-card');
            newCards.forEach(el => observer.observe(el));

        } catch (err) {
            console.error('Error fetching plans:', err);
            container.innerHTML = '<p class="error">Failed to load plans. Please try again later.</p>';
        }
    }

    // Scroll reveal animation
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Apply observer to static sections
    const revealElements = document.querySelectorAll('.history-card, .step-card');
    revealElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
        observer.observe(el);
    });

    // Add a helper class for visibility
    const style = document.createElement('style');
    style.innerHTML = `
        .visible {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        .error { color: #EF4444; text-align: center; width: 100%; grid-column: 1/-1; }
        .loading-plans { text-align: center; width: 100%; grid-column: 1/-1; opacity: 0.6; }
    `;
    document.head.appendChild(style);

    // Initial fetch
    fetchPlans();
});
