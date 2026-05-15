import { updateUserProfile } from "@/db/actions/Users";

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  imageUrl: string | null;
};

export function ProfileForm({ user }: { user: User }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSave(formData: FormData) {
    "use server";
    await updateUserProfile(user.id, {
      name: formData.get("name") as string,
      phone: (formData.get("phone") as string) || null,
    });
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6">
      <h2 className="text-base font-bold text-black dark:text-white mb-5">
        Profile
      </h2>

      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-black dark:text-white overflow-hidden border border-gray-200 dark:border-zinc-700 flex-shrink-0">
          {user.imageUrl ?
            <img
              src={user.imageUrl}
              alt={user.name}
              className="w-full h-full object-cover"
            />
          : initials}
        </div>
        <div>
          <p className="font-bold text-black dark:text-white">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Profile picture managed via Clerk
          </p>
        </div>
      </div>

      <form action={handleSave} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Full name
            </label>
            <input
              name="name"
              type="text"
              required
              defaultValue={user.name}
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-black dark:text-white text-sm outline-none focus:border-black dark:focus:border-white transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Email
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-100 dark:bg-zinc-800/50 text-gray-400 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Phone number
          </label>
          <input
            name="phone"
            type="tel"
            defaultValue={user.phone ?? ""}
            placeholder="+1 (555) 000-0000"
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-black dark:text-white text-sm outline-none focus:border-black dark:focus:border-white transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl text-sm font-bold hover:opacity-80 transition-opacity"
          >
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
