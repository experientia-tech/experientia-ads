// app/experientia/reports/[id]/page.tsx
import { Metadata } from 'next';
import ReportContent from './ReportContent';

interface Campaign {
  id: string;
  name: string;
  serviceType: string;
  logo: string;
}

interface PageProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: 'Report Details',
};

export default async function ReportPage({ params }: PageProps) {
  const campaignId = params.id;
  
  // This would typically be a database query in a real app
  const campaign: Campaign = {
    id: campaignId,
    name: 'Summer Sale 2023',
    serviceType: 'Social Media Marketing',
    logo: '/experentia.png',
  };

  return <ReportContent campaignId={campaignId} campaign={campaign} />;
}