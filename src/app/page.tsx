export default function Home() {
  const discordLink = 'https://discord.gg/';
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      <div>
        <h1 className='scroll-m-20 border-b pb-2 text-4xl font-extrabold tracking-tight lg:text-5xl'>
          Da Byscuits are back!
        </h1>
        <small className='text-sm leading-none text-muted-foreground'>
          The original server was banned and so was my account since it was the
          owner. Discord has refused to elaborate on the reason but we are back
          with a new server!
          <br /> <br />
          Join the new server here:{' '}
          <a
            href={discordLink}
            target='_blank'
            rel='noopener noreferrer'>
            {discordLink}
          </a>
        </small>
      </div>
      <div>
        <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0'>
          Heading 2
        </h2>
        <p className='text-sm text-muted-foreground'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam
          suscipit eligendi ex magnam a libero numquam labore quae impedit
          earum.
        </p>
      </div>
      <div>
        <h3 className='scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight'>
          Heading 3
        </h3>
        <p className='text-sm text-muted-foreground'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi fugit
          officiis fuga amet ipsa? Explicabo adipisci quaerat, nulla quibusdam
          ipsam quidem molestias sequi id in.
        </p>
      </div>
    </main>
  );
}
