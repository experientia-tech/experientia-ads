import { Metadata } from 'next';
import ReportContent from './ReportContent';

interface Campaign {
  id: string;
  serviceType: string;
  logo: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export const metadata: Metadata = {
  title: 'Report Details',
};

export default async function ReportPage({ params }: PageProps) {
  const resolvedParams = await params;
  const campaignId = resolvedParams.id;
  
  // This would typically be a database query in a real app
  const campaign: Campaign = {
    id: campaignId,
    serviceType: 'Social Media Marketing',
    logo: '/experentia.png',
  };

  return <ReportContent campaignId={campaignId} campaign={campaign} />;
}