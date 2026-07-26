import Banner from '../(app)/Banner';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Banner />
      {children}
    </>
  );
}
