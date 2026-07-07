import type { Profile } from '#/store/useFriendsStore'

export function UserAvatar(props: Profile) {
  const { avatar_url, full_name, email } = props

  return (
    <div className="flex flex-col justify-center items-center gap-4">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-25"></div>
        <img
          src={
            avatar_url ||
            `https://ui-avatars.com/api/?name=${full_name || email}`
          }
          alt={full_name}
          className="w-24 h-24 rounded-full border-4 border-zinc-800 relative z-10"
        />
      </div>
      <div className="space-y-1 text-center">
        <h2 className="text-white text-2xl font-semibold">{full_name}</h2>
        <p className="text-white">{email}</p>
      </div>
      <div className="flex flex-row items-end gap-2 text-green-600">
        Calling
        <div className="flex flex-row gap-2 mb-1.5">
          <div className="size-1 rounded-full bg-green-600 animate-bounce "></div>
          <div className="size-1 rounded-full bg-green-600 animate-bounce [animation-delay:-.3s]"></div>
          <div className="size-1 rounded-full bg-green-600 animate-bounce [animation-delay:-.5s]"></div>
        </div>
      </div>
    </div>
  )
}
