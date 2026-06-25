'use client';

import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Features from '@/components/Features';
import Stats from '@/components/Stats';
import Testimonials from '@/components/Testimonials';
import Pricing from '@/components/Pricing';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';
import SectionFade from '@/components/SectionFade';

const SmoothScroll = dynamic(() => import('@/components/SmoothScroll'), { ssr: false });
const CustomCursor = dynamic(() => import('@/components/CustomCursor'), { ssr: false });

export default function Page() {
  return (
    <SmoothScroll>
      <div className="noise" />
      <CustomCursor />
      <Nav />
      <main>
        <Hero />
        <SectionFade><HowItWorks /></SectionFade>
        <SectionFade><Features /></SectionFade>
        <SectionFade><Stats /></SectionFade>
        <SectionFade><Testimonials /></SectionFade>
        <SectionFade><Pricing /></SectionFade>
        <SectionFade><FAQ /></SectionFade>
      </main>
      <Footer />
    </SmoothScroll>
  );
}
