import Link from 'next/link';

const categories = [
  [
    'Wedding Halls',
    '128 vendors',
    'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Catering',
    '96 vendors',
    'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Photography',
    '74 vendors',
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Decor and Florals',
    '82 vendors',
    'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Makeup Artists',
    '58 vendors',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=900&q=80',
  ],
  [
    'Luxury Transport',
    '39 vendors',
    'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=900&q=80',
  ],
];

const steps = [
  [
    '01',
    'Apni shaadi banayein',
    'Dates, events, city aur family roles ek jagah set karein.',
  ],
  [
    '02',
    'Quote mangwayein',
    'Apni zaroorat share karein, vendors clear proposal bhejenge.',
  ],
  [
    '03',
    'Soch samajh kar compare karein',
    'Price, advance, trust aur availability side by side dekhein.',
  ],
  [
    '04',
    'Aaram se coordinate karein',
    'Bookings, payments, messages aur wedding-day kaam track karein.',
  ],
];

const vendors = [
  ['Noor Events Studio', 'Photography', 'Karachi', '4.9 rating', 'PKR 150,000'],
  ['Pearl Banquet', 'Wedding hall', 'Lahore', '4.8 rating', 'PKR 420,000'],
  ['Zaiqa Caterers', 'Catering', 'Islamabad', '4.7 rating', 'PKR 1,950/guest'],
];

export default function HomePage() {
  return (
    <main id="main-content" className="rb-page overflow-hidden">
      <header className="sticky top-0 z-40 border-b border-[rgba(200,164,93,0.28)] bg-[rgba(255,249,243,0.76)] backdrop-blur-2xl">
        <div className="rb-container flex h-20 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--rb-burgundy)] text-xl font-black text-white rb-serif">
              R
            </span>
            <span>
              <span className="block text-2xl font-black text-[var(--rb-burgundy-dark)] rb-serif">
                RasmBazaar
              </span>
              <span className="block text-xs font-bold uppercase tracking-[0.16em] text-[var(--rb-muted)]">
                Har rasm, har service
              </span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-bold text-[var(--rb-muted)] lg:flex">
            <Link href="/marketplace">Vendors</Link>
            <a href="#how">How it works</a>
            <Link href="/customer/weddings">Planner</Link>
            <Link href="/categories">Categories</Link>
            <Link href="/vendor/dashboard">For vendors</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-black text-[var(--rb-burgundy)] sm:inline"
            >
              Login
            </Link>
            <Link
              href="/customer/weddings/new"
              className="rb-button rb-button-primary hidden sm:inline-flex"
            >
              Planning Shuru Karein
            </Link>
          </div>
        </div>
      </header>

      <section className="rb-container grid min-h-[calc(100vh-5rem)] gap-12 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div className="relative z-10">
          <p className="rb-kicker">Apni shaadi, apni planning, apne log</p>
          <h1 className="rb-heading mt-6 max-w-[18rem] text-[2rem] leading-[0.96] sm:max-w-4xl sm:text-8xl lg:text-9xl">
            <span className="block">Shaadi ki planning,</span>
            <span className="block">ab tension nahi.</span>
          </h1>
          <p className="mt-8 max-w-[18rem] text-base leading-7 text-[var(--rb-muted)] sm:max-w-2xl sm:text-lg sm:leading-8">
            Har rasm, har service, ek jagah. Premium vendors, family tasks,
            proposals, bookings aur budget sab clear, sab aaram se.
          </p>
          <div className="mt-9 flex max-w-[18rem] flex-col gap-3 sm:max-w-none sm:flex-row">
            <Link
              href="/customer/weddings/new"
              className="rb-button rb-button-primary"
            >
              Planning Shuru Karein
            </Link>
            <Link href="/marketplace" className="rb-button rb-button-secondary">
              Vendor Talash Karein
            </Link>
          </div>
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              'Apne sheher ke verified vendors',
              'Har faisla soch samajh kar',
              'Kis ne kya karna hai? Sab clear',
            ].map((item) => (
              <div key={item} className="rb-card-soft rb-card-lift p-5">
                <span className="rb-icon">+</span>
                <p className="mt-4 text-sm font-black text-[var(--rb-burgundy-dark)]">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative min-h-[680px]">
          <div className="absolute -right-10 top-0 h-[620px] w-[82%] rb-arch-frame bg-[url('https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1300&q=85')] bg-cover bg-center" />
          <div className="absolute inset-x-0 bottom-0 h-64 rounded-[32px] bg-[linear-gradient(180deg,transparent,rgba(255,249,243,0.95))]" />
          <div className="absolute left-0 top-16 rb-card rb-floral w-80 p-6">
            <p className="rb-kicker">Wedding progress</p>
            <div className="mt-5 h-2 rounded-full bg-[var(--rb-blush)]">
              <div className="h-2 w-[74%] rounded-full bg-[var(--rb-burgundy)]" />
            </div>
            <p className="mt-4 text-sm font-bold text-[var(--rb-muted)]">
              74% planned - sab kuch time par, sab kuch aaram se
            </p>
          </div>
          <div className="absolute right-0 top-64 rb-card w-80 p-6">
            <p className="rb-kicker">Har faisla soch samajh kar</p>
            <h3 className="mt-3 text-3xl font-bold rb-serif text-[var(--rb-burgundy-dark)]">
              Noor Events Studio
            </h3>
            <p className="mt-4 text-sm leading-6 text-[var(--rb-muted)]">
              PKR 875,000 - 30% advance - 4.9 rating
            </p>
            <span className="rb-badge mt-4">Platform trusted</span>
          </div>
          <div className="absolute bottom-12 left-10 rb-card w-[23rem] p-6">
            <p className="rb-kicker">Budget haath se nikalne na do</p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
              <span>
                <b className="block text-2xl text-[var(--rb-burgundy)] rb-serif">
                  2.5M
                </b>
                Total
              </span>
              <span>
                <b className="block text-2xl text-[var(--rb-success)] rb-serif">
                  1.1M
                </b>
                Paid
              </span>
              <span>
                <b className="block text-2xl text-[var(--rb-warning)] rb-serif">
                  625k
                </b>
                Due
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="rb-container -mt-4">
        <form
          action="/marketplace"
          className="rb-card grid gap-4 p-5 md:grid-cols-[1.5fr_1fr_1fr_auto]"
        >
          <input
            name="q"
            className="rb-input"
            aria-label="Search vendors or services"
            placeholder="Search halls, caterers, photographers and more"
          />
          <input
            name="city"
            className="rb-input"
            aria-label="City"
            placeholder="City"
          />
          <input
            name="date"
            className="rb-input"
            type="date"
            aria-label="Event date"
          />
          <button type="submit" className="rb-button rb-button-primary">
            Vendor Talash Karein
          </button>
        </form>
      </section>

      <section id="categories" className="rb-container py-24">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rb-kicker">Har rasm ke liye sahi vendor</p>
            <h2 className="rb-heading mt-3 max-w-3xl text-6xl">
              Mehndi ho ya Walima, team perfect honi chahiye.
            </h2>
          </div>
          <Link href="/categories" className="rb-button rb-button-secondary">
            Sab Categories Dekhein
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {categories.map(([name, count, image]) => (
            <Link
              href="/marketplace"
              key={name}
              className="rb-card rb-card-lift group overflow-hidden"
            >
              <div
                className="h-56 bg-cover bg-center transition duration-500 group-hover:scale-[1.04]"
                style={{
                  backgroundImage: `linear-gradient(180deg, transparent, rgba(66,17,38,0.26)), url(${image})`,
                }}
              />
              <div className="p-6">
                <h3 className="text-3xl font-bold rb-serif text-[var(--rb-burgundy-dark)]">
                  {name}
                </h3>
                <p className="mt-1 text-sm font-bold text-[var(--rb-muted)]">
                  {count}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section
        id="how"
        className="relative bg-[var(--rb-burgundy-dark)] py-24 text-white"
      >
        <div className="absolute inset-0 rb-jali opacity-40" />
        <div className="rb-container relative">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--rb-gold)]">
            Ab planning WhatsApp par nahi
          </p>
          <h2 className="mt-4 max-w-4xl text-6xl font-bold rb-serif">
            Bas shaadi enjoy karein, planning hum sambhal lein.
          </h2>
          <div className="mt-12 grid gap-5 md:grid-cols-4">
            {steps.map(([number, title, copy]) => (
              <div
                key={title}
                className="rounded-[20px] border border-white/15 bg-white/[0.08] p-6 backdrop-blur"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--rb-gold)] font-black text-[var(--rb-burgundy-dark)]">
                  {number}
                </span>
                <h3 className="mt-6 text-2xl font-bold rb-serif">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/70">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rb-container grid gap-8 py-24 lg:grid-cols-[1fr_0.9fr]">
        <div className="rb-card rb-floral p-8 md:p-10">
          <p className="rb-kicker">Kis ne kya karna hai? Sab clear.</p>
          <h2 className="rb-heading mt-4 text-6xl">
            Apne log, apni zimmedariyan, ek clear plan.
          </h2>
          <p className="mt-6 max-w-2xl text-[var(--rb-muted)]">
            Tasks, approvals, budget aur reminders structured rehte hain, magar
            shaadi ka feel corporate nahi hota.
          </p>
          <div className="mt-8 space-y-4">
            {[
              'Book caterer tasting',
              'Confirm mehndi decor palette',
              'Collect final guest count',
            ].map((task, index) => (
              <div
                key={task}
                className="rb-card-soft flex items-center justify-between gap-4 p-5"
              >
                <div>
                  <h3 className="font-black text-[var(--rb-burgundy-dark)]">
                    {task}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--rb-muted)]">
                    {['Sara', 'Aisha', 'Hammad'][index]} - due this week
                  </p>
                </div>
                <span className="rb-badge">
                  {['Evidence', 'Approval', 'Pending'][index]}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-6">
          <div className="rb-card p-8">
            <p className="rb-kicker">Har faisla soch samajh kar</p>
            <h2 className="rb-heading mt-4 text-5xl">
              Quote compare karein, phir dil se decide karein.
            </h2>
            <div className="mt-7 overflow-hidden rounded-2xl border border-[var(--rb-border)]">
              {['Price', 'Advance', 'Rating', 'Cancellation'].map(
                (row, index) => (
                  <div
                    key={row}
                    className="grid grid-cols-3 border-b border-[var(--rb-border)] bg-white text-sm last:border-b-0"
                  >
                    <span className="p-4 font-black text-[var(--rb-muted)]">
                      {row}
                    </span>
                    <span className="p-4">
                      {['875k', '250k', '4.9', '14 days'][index]}
                    </span>
                    <span className="bg-[var(--rb-ivory)] p-4">
                      {['910k', '300k', '4.7', '7 days'][index]}
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>
          <div className="rb-card p-8">
            <p className="rb-kicker">Bharosa pehle</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {[
                'Vendor verification',
                'Structured agreements',
                'Payment records',
                'Verified reviews',
              ].map((item) => (
                <span key={item} className="rb-badge justify-start">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rb-container py-20">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="rb-kicker">Apne sheher ke verified wedding vendors</p>
            <h2 className="rb-heading mt-3 text-6xl">
              Vendor talash karna ab mushkil nahi.
            </h2>
          </div>
          <Link href="/marketplace" className="rb-button rb-button-secondary">
            Vendor Talash Karein
          </Link>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {vendors.map(([name, category, city, rating, price]) => (
            <div key={name} className="rb-card rb-card-lift overflow-hidden">
              <div className="h-48 bg-[url('https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80')] bg-cover bg-center" />
              <div className="p-6">
                <span className="rb-badge">Verified</span>
                <h3 className="mt-5 text-3xl font-bold rb-serif text-[var(--rb-burgundy-dark)]">
                  {name}
                </h3>
                <p className="mt-2 text-sm text-[var(--rb-muted)]">
                  {category} - {city} - {rating}
                </p>
                <p className="mt-5 font-black text-[var(--rb-burgundy)]">
                  {price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rb-container grid gap-6 py-24 lg:grid-cols-[1fr_0.76fr]">
        <div className="rounded-[28px] bg-[var(--rb-burgundy)] p-10 text-white shadow-2xl">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-[var(--rb-gold)]">
            Wedding businesses ke liye
          </p>
          <h2 className="mt-4 text-6xl font-bold rb-serif">
            Serious clients, clear requirements, better bookings.
          </h2>
          <p className="mt-6 max-w-2xl text-white/75">
            Apna polished profile banayein, qualified leads receive karein,
            structured proposals bhejein, aur verified reviews collect karein.
          </p>
          <Link
            href="/register"
            className="rb-button mt-9 bg-white text-[var(--rb-burgundy)]"
          >
            Business List Karein
          </Link>
        </div>
        <div className="rb-card rb-floral p-8">
          <p className="rb-kicker">Families say</p>
          <blockquote className="mt-6 text-4xl font-bold leading-tight rb-serif text-[var(--rb-burgundy-dark)]">
            &quot;Ab planning screenshots aur WhatsApp par nahi. Sab kuch ek
            jagah, sab ko clear.&quot;
          </blockquote>
          <p className="mt-6 text-sm font-black text-[var(--rb-muted)]">
            Aisha Khan - Lahore
          </p>
        </div>
      </section>

      <footer className="bg-[var(--rb-burgundy-dark)] py-14 text-white">
        <div className="rb-container grid gap-8 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <h2 className="text-4xl font-bold rb-serif">RasmBazaar</h2>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              Har rasm, har service, ek jagah. Desi families ke liye premium
              wedding planning.
            </p>
          </div>
          {['Marketplace', 'Planning', 'Company'].map((group) => (
            <div key={group}>
              <h3 className="font-black text-[var(--rb-gold)]">{group}</h3>
              <div className="mt-4 space-y-2 text-sm text-white/70">
                <Link className="block hover:text-white" href="/marketplace">
                  Vendors
                </Link>
                <Link
                  className="block hover:text-white"
                  href="/customer/bookings"
                >
                  Bookings
                </Link>
                <Link
                  className="block hover:text-white"
                  href="/customer/reviews"
                >
                  Trust and safety
                </Link>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
