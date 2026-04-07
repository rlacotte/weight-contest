import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { EditProfileForm } from "@/components/profile/EditProfileForm";

export default async function EditProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth/login");

  const profile = await prisma.profiles.findUnique({
    where: { user_id: session.user.id },
  });

  if (!profile) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Modifier le profil</h1>
      </div>
      <EditProfileForm profile={profile as any} />
    </div>
  );
}
