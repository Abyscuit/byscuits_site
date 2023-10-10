export default function Home() {
  return (
    <main className='flex min-h-screen flex-col items-center justify-between p-24'>
      <div>
        <h1 className='scroll-m-20 border-b pb-2 text-4xl font-extrabold tracking-tight lg:text-5xl'>Heading 1</h1>
        <small className='text-sm font-medium leading-none'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Maiores sed,
          temporibus porro, excepturi suscipit, repudiandae voluptatem quas
          exercitationem quia fugiat minus molestias facere cupiditate deleniti
          ad omnis eum beatae fuga alias ipsam a recusandae? Possimus sint est
          sunt sit ab nesciunt deleniti cum id veniam. Cum eum rem inventore.
          Neque.
        </small>
      </div>
      <div>
        <h2 className='scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0'>Heading 2</h2>
        <p className='text-sm text-muted-foreground'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Totam
          suscipit eligendi ex magnam a libero numquam labore quae impedit
          earum.
        </p>
      </div>
      <div>
        <h3 className='scroll-m-20 border-b pb-2 text-2xl font-semibold tracking-tight'>Heading 3</h3>
        <p className='text-sm text-muted-foreground'>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Sequi fugit
          officiis fuga amet ipsa? Explicabo adipisci quaerat, nulla quibusdam
          ipsam quidem molestias sequi id in.
        </p>
      </div>
    </main>
  );
}
