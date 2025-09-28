import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Quiz Video Generator
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Create engaging YouTube Shorts quiz videos for Indian students with AI-powered question generation
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/auth/signin"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
            >
              Sign In to Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="bg-white hover:bg-gray-50 text-indigo-600 font-semibold py-3 px-8 rounded-lg border border-indigo-200 transition-colors"
            >
              View Demo
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🤖</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">AI Question Generation</h3>
            <p className="text-gray-600">
              Generate syllabus-based quiz questions using OpenAI for Classes 9-12 Science subjects
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎥</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">Video Generation</h3>
            <p className="text-gray-600">
              Create professional YouTube Shorts with countdown timers and animated answer reveals
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📺</span>
            </div>
            <h3 className="text-xl font-semibold mb-3">YouTube Integration</h3>
            <p className="text-gray-600">
              Automatically upload videos to YouTube with proper titles, descriptions, and tags
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Setup Classes & Subjects</h3>
              <p className="text-gray-600 text-sm">Define your curriculum structure</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">Generate Questions</h3>
              <p className="text-gray-600 text-sm">Use AI to create quiz questions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Create Video</h3>
              <p className="text-gray-600 text-sm">Generate engaging quiz videos</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Upload to YouTube</h3>
              <p className="text-gray-600 text-sm">Share with your audience</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Join the admin dashboard to start creating amazing quiz videos for your students
          </p>
          <Link
            href="/auth/signin"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-12 rounded-lg text-lg transition-colors inline-block"
          >
            Access Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
