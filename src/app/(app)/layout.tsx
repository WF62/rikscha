import Banner from './Banner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Banner />
      <main>{children}</main>
    </>
  );
}
