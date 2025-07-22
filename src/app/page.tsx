export default function Home() {
  const discordLink = atob('aHR0cHM6Ly9kaXNjb3JkLmdnL2J5c2N1aXRz');
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-8 md:p-24'>
      <div className="max-w-xl w-full flex flex-col gap-8 items-center">
        <h1 className='scroll-m-20 border-b pb-2 text-4xl font-extrabold tracking-tight lg:text-5xl text-center'>
          Da Byscuits are back!
        </h1>
        <small className='text-sm leading-none text-muted-foreground text-center'>
          The original server was banned and so was my account since it was the owner. Discord has refused to elaborate on the reason but we are back with a new server!
          <br /> <br />
          <span className="font-semibold">Join the new server here:</span>{' '}
          <a
            href={discordLink}
            target='_blank'
            rel='noopener noreferrer'
            className="underline text-primary hover:text-primary/80"
          >
            {discordLink}
          </a>
        </small>

        {/* Cloud Storage Promo */}
        <div className="w-full bg-card border rounded-lg p-6 flex flex-col items-center gap-3 shadow">
          <h2 className="text-2xl font-bold text-center">Free Cloud Storage for Da Byscuits Members!</h2>
          <p className="text-center text-muted-foreground">
            If you&apos;re in our Discord server, you get access to your own private cloud storage—upload, share, and access your files from anywhere.<br/>
            <span className="font-semibold">Not a member?</span> Join the Discord above to unlock this feature!
          </p>
          <a href="/cloud-dashboard">
            <button className="mt-2 px-6 py-2 bg-indigo-600 text-white rounded font-semibold shadow hover:bg-indigo-700 transition-colors">
              Go to Cloud Storage
            </button>
          </a>
        </div>

        {/* Sticky Community Features Teaser */}
        <div className="w-full bg-secondary/30 border rounded-lg p-6 flex flex-col gap-2 items-center mt-4">
          <h3 className="text-xl font-semibold mb-2">What else can you do here?</h3>
          <div className="text-muted-foreground text-center text-base font-medium">
            Not much!
            But more features are coming soon!
          </div>
        </div>
      </div>
    </main>
  );
}
