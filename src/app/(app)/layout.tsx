import Banner from './Banner';
import ZurueckLeiste from './ZurueckLeiste';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Banner />
      <ZurueckLeiste />
      <main>{children}</main>
    </>
  );
}
