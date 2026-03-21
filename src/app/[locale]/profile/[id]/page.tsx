import { ProfileView } from "@/components/profile/ProfileView";

export default function ProfilePage({ params }: { params: { id: string } }) {
  return <ProfileView userId={params.id} />;
}
