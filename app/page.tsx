export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              🎁 Giveaways App
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Create and manage exciting giveaways for your community
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-3">For Admins</h3>
              <p className="text-purple-100">
                Create, manage, and track giveaways with detailed analytics and
                winner selection tools.
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-6 text-white">
              <h3 className="text-xl font-semibold mb-3">For Members</h3>
              <p className="text-blue-100">
                Participate in exciting giveaways and track your entries in a
                beautiful, easy-to-use interface.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              🔗 How to Access
            </h3>
            <p className="text-gray-600">
              This app is designed to work within the Whop ecosystem. To access
              your giveaways, visit your Whop experience URL where this app is
              installed.
            </p>
          </div>

          <div className="text-sm text-gray-500">
            <p>Built with ❤️ using Next.js and the Whop Apps SDK</p>
          </div>
        </div>
      </div>
    </div>
  );
}
