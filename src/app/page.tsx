import Link from 'next/link';
import {
    Building2,
    Users,
    CreditCard,
    Wrench,
    Shield,
    BarChart3,
    ArrowRight,
    Star,
    CheckCircle2,
    Zap,
    Clock,
    TrendingUp,
    Globe,
    Lock,
    Smartphone,
    HeadphonesIcon,
} from 'lucide-react';

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                            <span className="text-white font-bold text-lg">N</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900">Nook</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Features</a>
                        <a href="#why-nook" className="text-gray-600 hover:text-gray-900 transition">Why Nook</a>
                        <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition">How It Works</a>
                        <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition">Testimonials</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium transition">
                            Sign In
                        </Link>
                        <Link
                            href="/register"
                            className="bg-gradient-to-r from-cyan-500 to-teal-600 text-white px-5 py-2.5 rounded-lg font-medium hover:opacity-90 transition shadow-lg shadow-cyan-500/25"
                        >
                            Get Started Free
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-6 bg-gradient-to-b from-cyan-50/50 to-white">
                <div className="max-w-7xl mx-auto">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-pulse">
                            <Star className="w-4 h-4 fill-cyan-500" />
                            Trusted by 2,000+ landlords worldwide
                        </div>

                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                            Manage Your Rental Properties
                            <span className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent"> Like a Pro</span>
                        </h1>

                        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                            The all-in-one property management platform that simplifies rent collection, tenant communication,
                            maintenance tracking, and document organization — so you can focus on growing your portfolio.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link
                                href="/register"
                                className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 group"
                            >
                                Start Your Free Trial
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="#demo"
                                className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:border-cyan-500 hover:text-cyan-600 transition"
                            >
                                Watch Demo
                            </Link>
                        </div>

                        <p className="text-sm text-gray-500 mt-6">
                            ✓ No credit card required &nbsp; ✓ Setup in minutes &nbsp; ✓ Cancel anytime
                        </p>
                    </div>

                    {/* Dashboard Preview */}
                    <div className="mt-16 relative">
                        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10 pointer-events-none" />
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-3 shadow-2xl">
                            <div className="bg-gray-100 rounded-2xl overflow-hidden">
                                <div className="bg-white p-8">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        {[
                                            { label: 'Rent Due', value: '$45.2K', color: 'text-gray-900' },
                                            { label: 'Collected', value: '$38.4K', color: 'text-green-600' },
                                            { label: 'Overdue', value: '$6.8K', color: 'text-red-500' },
                                            { label: 'Occupancy', value: '92%', color: 'text-cyan-600' },
                                            { label: 'Open Tickets', value: '8', color: 'text-orange-500' },
                                            { label: 'Vacant Units', value: '4', color: 'text-gray-600' },
                                        ].map((stat, i) => (
                                            <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 hover:shadow-md transition-shadow">
                                                <div className="text-sm text-gray-500 mb-2 font-medium">{stat.label}</div>
                                                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Bar */}
            <section className="py-12 px-6 bg-gray-50 border-y border-gray-100">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '2,000+', label: 'Active Landlords' },
                            { value: '15,000+', label: 'Properties Managed' },
                            { value: '$50M+', label: 'Rent Collected' },
                            { value: '99.9%', label: 'Uptime Guaranteed' },
                        ].map((stat, i) => (
                            <div key={i}>
                                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" />
                            Powerful Features
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                            Everything You Need to <br className="hidden md:block" />
                            <span className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent">Manage Properties Effortlessly</span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            From tracking rent payments to handling maintenance requests, Nook provides
                            all the tools you need to run your rental business efficiently.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            { icon: Building2, title: 'Property Management', desc: 'Organize all your properties and units in one intuitive dashboard. Track occupancy, performance metrics, and property details at a glance.' },
                            { icon: Users, title: 'Tenant Portal', desc: 'Give tenants their own dedicated app to view rent status, submit maintenance requests, access documents, and communicate directly with you.' },
                            { icon: CreditCard, title: 'Smart Rent Collection', desc: 'Track payments automatically, generate recurring rent charges, send payment reminders, and see who\'s paid and who\'s overdue instantly.' },
                            { icon: Wrench, title: 'Maintenance Tracking', desc: 'Receive, assign, and manage maintenance requests seamlessly. Track progress from submission to completion with photo documentation.' },
                            { icon: BarChart3, title: 'Financial Reports', desc: 'Get real-time insights into your rental income, expenses, occupancy rates, and outstanding balances with beautiful visual reports.' },
                            { icon: Shield, title: 'Secure Document Storage', desc: 'Store lease agreements, ID proofs, receipts, and important documents securely in the cloud. Access them anytime, anywhere.' },
                        ].map((feature, i) => (
                            <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:border-cyan-200 transition-all duration-300 group">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Nook Section */}
            <section id="why-nook" className="py-24 px-6 bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-cyan-500/20 text-cyan-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                                <TrendingUp className="w-4 h-4" />
                                Why Choose Us
                            </div>
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                                Why Landlords <br />
                                <span className="bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">Love Nook</span>
                            </h2>
                            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                                We built Nook to solve the real challenges landlords face every day.
                                No more spreadsheets, no more chasing tenants, no more paperwork headaches.
                            </p>

                            <div className="space-y-6">
                                {[
                                    { icon: Clock, title: 'Save 10+ Hours Per Week', desc: 'Automate repetitive tasks and focus on what matters — growing your portfolio.' },
                                    { icon: Globe, title: 'Access Anywhere', desc: 'Manage your properties from your laptop, tablet, or phone. Your data syncs in real-time.' },
                                    { icon: Lock, title: 'Bank-Level Security', desc: 'Your data is encrypted and protected with enterprise-grade security protocols.' },
                                    { icon: HeadphonesIcon, title: 'World-Class Support', desc: 'Our dedicated support team is here to help you succeed, 7 days a week.' },
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                                            <item.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                                            <p className="text-gray-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-gradient-to-br from-cyan-500/20 to-teal-600/20 rounded-3xl p-8 backdrop-blur">
                                <div className="bg-white rounded-2xl p-6 shadow-2xl">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                                            <Smartphone className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-900">Mobile-First Design</div>
                                            <div className="text-sm text-gray-500">Manage on the go</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {['Instant push notifications', 'Quick payment tracking', 'Easy tenant messaging', 'Photo-based maintenance'].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-gray-700">
                                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-2xl opacity-20 blur-2xl" />
                            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-full opacity-20 blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 px-6 bg-gray-50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Zap className="w-4 h-4" />
                            Simple Setup
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                            Get Started in <span className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent">3 Easy Steps</span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Setting up Nook takes just minutes. No technical knowledge required.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { step: '01', title: 'Create Your Account', desc: 'Sign up for free and set up your landlord profile. No credit card required to start.' },
                            { step: '02', title: 'Add Your Properties', desc: 'Import your properties and units. Add tenant details, lease information, and documents.' },
                            { step: '03', title: 'Start Managing', desc: 'Track rent, handle maintenance, communicate with tenants, and access reports — all in one place.' },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 h-full">
                                    <div className="text-6xl font-bold text-gray-100 mb-4">{item.step}</div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                                    <p className="text-gray-600">{item.desc}</p>
                                </div>
                                {i < 2 && (
                                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                                        <ArrowRight className="w-8 h-8 text-cyan-500" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-24 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <Star className="w-4 h-4 fill-yellow-500" />
                            Customer Stories
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
                            Loved by Landlords <span className="bg-gradient-to-r from-cyan-500 to-teal-600 bg-clip-text text-transparent">Everywhere</span>
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Don't just take our word for it. Here's what property owners say about Nook.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "Nook has completely transformed how I manage my 12 properties. What used to take me hours now takes minutes. The tenant portal alone has saved me countless phone calls.",
                                name: 'Sarah Johnson',
                                role: 'Property Owner, 12 Units',
                                avatar: 'SJ'
                            },
                            {
                                quote: "As someone who manages properties remotely, Nook has been a game-changer. I can handle everything from my phone, and the automated rent reminders have improved my collection rate by 30%.",
                                name: 'Michael Chen',
                                role: 'Real Estate Investor, 25 Units',
                                avatar: 'MC'
                            },
                            {
                                quote: "Finally, a property management tool that's actually easy to use! The maintenance tracking feature keeps everyone in the loop, and my tenants love the transparency.",
                                name: 'Emily Williams',
                                role: 'Landlord, 8 Units',
                                avatar: 'EW'
                            },
                        ].map((testimonial, i) => (
                            <div key={i} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow">
                                <div className="flex gap-1 mb-6">
                                    {[...Array(5)].map((_, j) => (
                                        <Star key={j} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                    ))}
                                </div>
                                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                                        {testimonial.avatar}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-gray-900">{testimonial.name}</div>
                                        <div className="text-sm text-gray-500">{testimonial.role}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 px-6 bg-gradient-to-br from-cyan-600 to-teal-700">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                        Ready to Simplify Your <br className="hidden md:block" />
                        Property Management?
                    </h2>
                    <p className="text-xl text-cyan-100 mb-10 max-w-2xl mx-auto">
                        Join thousands of landlords who have transformed their rental business with Nook.
                        Start your free trial today — no credit card required.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link
                            href="/register"
                            className="w-full sm:w-auto bg-white text-cyan-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-cyan-50 transition shadow-xl flex items-center justify-center gap-2 group"
                        >
                            Get Started Free
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href="#demo"
                            className="w-full sm:w-auto border-2 border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/10 transition"
                        >
                            Schedule a Demo
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 bg-gray-900">
                <div className="max-w-7xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-12 mb-12">
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">N</span>
                                </div>
                                <span className="font-bold text-xl text-white">Nook</span>
                            </div>
                            <p className="text-gray-400 max-w-sm leading-relaxed">
                                The all-in-one property management platform that helps landlords save time,
                                reduce stress, and grow their rental business.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Product</h4>
                            <ul className="space-y-3 text-gray-400">
                                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                                <li><a href="#testimonials" className="hover:text-white transition">Testimonials</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-white mb-4">Company</h4>
                            <ul className="space-y-3 text-gray-400">
                                <li><a href="#" className="hover:text-white transition">About Us</a></li>
                                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-400 text-sm">© 2026 Nook. All rights reserved.</p>
                        <div className="flex items-center gap-6 text-sm text-gray-400">
                            <a href="#" className="hover:text-white transition">Twitter</a>
                            <a href="#" className="hover:text-white transition">LinkedIn</a>
                            <a href="#" className="hover:text-white transition">Facebook</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
