CSS Cleanup Table (Draft)
File	Selector/Class	First Seen In (component.tsx:line)	Status	Action	Notes
src/styles/landingpage.css	.lang-icon	—	MISS	delete	Legacy language toggle button removed after Navigation rewrite
src/styles/landingpage.css	.bio	—	MISS	delete	Old appointment bio column no longer rendered in React layout
src/styles/landingpage.css	.forest-hero	—	MISS	delete	Hero background now handled via inline Tailwind utilities
src/styles/landingpage.css	.map-slider-area	src/pages/Landing.tsx:399	HIT	migrate to @apply	Container for store map carousel layout
src/styles/landingpage.css	.map-slider	src/pages/Landing.tsx:400	HIT	migrate to @apply	Wraps map slides and controls horizontal flow
src/styles/landingpage.css	.map-slide	src/pages/Landing.tsx:402	HIT	migrate to @apply	Individual clinic slide styling (active/prev handling)
src/styles/landingpage.css	.map-display	src/pages/Landing.tsx:403	HIT	migrate to @apply	Holds city imagery / overlay mask
src/styles/landingpage.css	.map-nav-btn	src/pages/Landing.tsx:483	HIT	migrate to @apply	Prev/next buttons for clinic carousel
src/styles/landingpage.css	.map-indicators	src/pages/Landing.tsx:499	HIT	migrate to @apply	Dot indicator container for clinic carousel
src/styles/landingpage.css	.distance-card	src/pages/Landing.tsx:529	HIT	migrate to @apply	Distance sidebar card for clinic info
src/styles/landingpage.css	.distance-title-container	src/pages/Landing.tsx:530	HIT	migrate to @apply	Title wrapper for distance summary
src/styles/landingpage.css	.visit-california-btn	src/pages/Landing.tsx:543	HIT	migrate to @apply	CTA button linking to Visit California
src/styles/landingpage.css	.trip-book-btn	src/pages/Landing.tsx:396	HIT	migrate to @apply	“Book Now” CTA in map trip card
src/styles/landingpage.css	.community-nav-btn	src/pages/Landing.tsx:278	HIT	migrate to @apply	Navigation arrows for community carousel
src/styles/landingpage.css	.community-indicator	src/pages/Landing.tsx:294	HIT	migrate to @apply	Dots for community carousel paging
src/styles/faq-clean.css	.site-header	—	MISS	delete	Legacy header wrapper superseded by Navigation component
src/styles/faq-clean.css	.menu	—	MISS	delete	Mobile menu icon class unused in React implementation
src/styles/faq-clean.css	.open-nav	—	MISS	delete	Overlay menu toggle state removed with Tailwind nav
src/styles/faq-clean.css	.hero-section	src/pages/FAQ.tsx:131	HIT	migrate to @apply	FAQ hero background wrapper also reused by detail pages
src/styles/faq-clean.css	.hero-content	src/pages/FAQ.tsx:134	HIT	migrate to @apply	Hero copy block controlling breadcrumb + intro spacing
src/styles/faq-clean.css	.breadcrumb-wrapper	src/pages/FAQ.tsx:136	HIT	migrate to @apply	Shared breadcrumb container across FAQ & detail pages
src/styles/faq-clean.css	.hero-description	src/pages/FAQ.tsx:140	HIT	migrate to @apply	Intro paragraph styling under hero title
src/styles/faq-clean.css	.section-header	src/pages/FAQ.tsx:151	HIT	migrate to @apply	Section heading wrapper reused by service detail pages
src/styles/faq-clean.css	.section-title-elegant	src/pages/FAQ.tsx:152	HIT	migrate to @apply	Display serif heading for FAQ sections
src/styles/faq-clean.css	.maples	src/pages/FAQ.tsx:157	HIT	keep in legacy-bridge (temp)	Decorative background sprite pending Tailwind token strategy
src/styles/faq-clean.css	.maple2	src/pages/FAQ.tsx:158	HIT	keep in legacy-bridge (temp)	Secondary maple leaf decoration still required visually
src/styles/faq-clean.css	.pinecone	src/pages/FAQ.tsx:159	HIT	keep in legacy-bridge (temp)	Pinecone overlay stays until art migrated to Tailwind layers
src/styles/faq-clean.css	.carousel-indicators	src/pages/FAQ.tsx:338	HIT	migrate to @apply	Amenities carousel indicator bar
src/styles/faq-clean.css	.indicator	src/pages/FAQ.tsx:342	HIT	migrate to @apply	Dot element for carousel state display
src/styles/faq-clean.css	.tips-carousel	src/pages/FAQ.tsx:361	HIT	migrate to @apply	Wrapper for tips slider cards
src/styles/faq-clean.css	.tips-carousel-nav	src/pages/FAQ.tsx:391	HIT	migrate to @apply	Prev/next controls in tips carousel
src/styles/faq-clean.css	.tips-carousel-indicators	src/pages/FAQ.tsx:406	HIT	migrate to @apply	Indicator row for tips carousel
src/styles/faq-clean.css	.tips-indicator	src/pages/FAQ.tsx:410	HIT	migrate to @apply	Individual tip indicator dot styling
src/styles/service.css	.sub-hero	src/pages/Service.tsx:156	HIT	migrate to @apply	Service hero wrapper providing background overlay
src/styles/service.css	.services-main-content	src/pages/Service.tsx:188	HIT	migrate to @apply	Secondary service card grid container
src/styles/service.css	.bread-wrapper	src/pages/Service.tsx:164	HIT	migrate to @apply	Breadcrumb bar under service hero
src/styles/service.css	.sub-desc	src/pages/Service.tsx:175	HIT	migrate to @apply	Service hero descriptive paragraph
src/styles/service.css	.featured-cabins	src/pages/Service.tsx:170	HIT	migrate to @apply	Legacy grid class for service cards
src/styles/service.css	.dental-footer	—	MISS	delete	Footer spacer no longer rendered in React layout
src/styles/service.css	.cabin-title	—	MISS	delete	Old card heading class removed after React card refactor
src/styles/service.css	.cabin-desc	—	MISS	delete	Legacy multi-line description styling unused in new card
src/styles/service.css	.cabin-cta	—	MISS	delete	CTA link class superseded by Tailwind button styles
src/styles/service.css	.transparent-img	—	MISS	delete	Arrow image helper not referenced by React components
src/styles/services-detail.css	.hero-section	src/pages/ServicesDetail1.tsx:26	HIT	migrate to @apply	Detail page hero band styling
src/styles/services-detail.css	.hero-content	src/pages/ServicesDetail1.tsx:29	HIT	migrate to @apply	Detail hero copy container
src/styles/services-detail.css	.service-detail-block	src/pages/ServicesDetail1.tsx:48	HIT	migrate to @apply	Section wrapper for each service anchor
src/styles/services-detail.css	.service-carousel	src/pages/ServicesDetail1.tsx:54	HIT	migrate to @apply	Carousel wrapper around image + text
src/styles/services-detail.css	.pricing-section	src/pages/ServicesDetail1.tsx:76	HIT	migrate to @apply	Pricing card section grouping
src/styles/services-detail.css	.pricing-card	src/pages/ServicesDetail1.tsx:79	HIT	migrate to @apply	Individual pricing card container
src/styles/services-detail.css	.pricing-card.featured	src/pages/ServicesDetail1.tsx:88	HIT	migrate to @apply	Highlighted pricing tier embellishment
src/styles/services-detail.css	.package-name	src/pages/ServicesDetail1.tsx:80	HIT	migrate to @apply	Pricing card heading typography
src/styles/services-detail.css	.package-price	src/pages/ServicesDetail1.tsx:81	HIT	migrate to @apply	Pricing amount styling within cards
src/styles/services-detail.css	.package-features	src/pages/ServicesDetail1.tsx:82	HIT	migrate to @apply	Feature list formatting inside pricing cards
src/styles/services-detail.css	.featured-badge	src/pages/ServicesDetail1.tsx:89	HIT	migrate to @apply	“Most popular” badge pill styling
src/styles/services-detail.css	.back-to-top-btn	—	MISS	delete	Back-to-top control removed from React detail pages
src/styles/chat-assistant.css	.chat-assistant-widget	—	MISS	delete	Legacy floating widget wrapper replaced by Tailwind button
src/styles/chat-assistant.css	.chat-toggle	—	MISS	delete	Old toggle button class unused by ChatFloatingButton
src/styles/chat-assistant.css	.chat-icon	—	MISS	delete	Icon styling replaced by font-awesome utilities in JS
src/styles/chat-assistant.css	.vip-badge	—	MISS	delete	VIP badge now rendered with Tailwind utility classes
src/styles/chat-assistant.css	.notification-dot	—	MISS	delete	Notification indicator removed from current chat UI
src/styles/chat-assistant.css	.chat-window	—	MISS	delete	Legacy modal window replaced by Tailwind panel
src/styles/chat-assistant.css	.chat-header	—	MISS	delete	Old header gradient unused with new React chat shell
src/index.css	.card-surface	src/components/AppointmentForm.tsx:413	HIT	keep in legacy-bridge (temp)	Shared glassmorphism container still applied via className
src/index.css	.btn-primary	src/components/chat/ChatPanel.tsx:152	HIT	keep in legacy-bridge (temp)	Primary action button used across forms/chat
src/index.css	.btn-outline	src/components/AppointmentForm.tsx:266	HIT	keep in legacy-bridge (temp)	Outline variant leveraged in appointment flows
src/index.css	.form-label	src/components/AppointmentForm.tsx:157	HIT	keep in legacy-bridge (temp)	Uppercase label styling for forms
src/index.css	.form-input	src/components/AppointmentForm.tsx:162	HIT	keep in legacy-bridge (temp)	Inputs rely on shared padding/radius token
src/index.css	.form-select	src/components/AppointmentForm.tsx:231	HIT	keep in legacy-bridge (temp)	Select element styling reused in multiple steps
src/index.css	.form-textarea	src/components/AppointmentForm.tsx:307	HIT	keep in legacy-bridge (temp)	Description textarea styling
src/index.css	.badge	src/components/UserDashboard.tsx:256	HIT	keep in legacy-bridge (temp)	VIP badge pill still rendered in dashboard
src/index.css	.btn-secondary	—	MISS	delete	Secondary button variant unused after Tailwind refactor
Summary
src/styles/landingpage.css: 12 HIT, 3 MISS → migrate map/carousel classes; drop unused .lang-icon, .bio, .forest-hero.
src/styles/faq-clean.css: 15 HIT, 3 MISS → retain key FAQ/layout classes, remove obsolete nav toggles.
src/styles/service.css: 5 HIT, 5 MISS → only hero/grid helpers still active; legacy card classes (.cabin-*, .dental-footer) can be removed.
src/styles/services-detail.css: 11 HIT, 1 MISS → keep section/pricing selectors; delete unused .back-to-top-btn.
src/styles/chat-assistant.css: 0 HIT, 7 MISS → candidate for full removal (all selectors unused).
src/index.css: 8 HIT, 1 MISS → keep shared Tailwind component classes, drop unused .btn-secondary.
Recommended removals: src/styles/chat-assistant.css (entire file), plus targeted deletions in landingpage.css, service.css, and faq-clean.css for the noted MISS selectors.