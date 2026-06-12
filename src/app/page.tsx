"use client"

import { useSession, signIn, signOut } from "next-auth/react"
import { LogIn } from "lucide-react"
import MainApp from "@/components/MainApp"

export default function Page() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', padding: '20px'
      }}>
        <div style={{
          background: 'var(--surface)', padding: '40px', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px', width: '100%'
        }}>
          <img src={`/header.jpg?t=${Date.now()}`} alt="Sky English Header" style={{ width: '100%', marginBottom: '32px', borderRadius: '8px' }} />
          <h1 style={{ marginBottom: '16px', fontSize: '24px' }}>Welcome to Sky English</h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>Please sign in to access the teacher dashboard.</p>
          <button 
            onClick={() => signIn('google')} 
            className="btn-primary" 
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            <LogIn size={20} />
            Sign in with Google
          </button>
        </div>
      </div>
    )
  }

  return (
    <MainApp teacherName={session.user?.name || "Teacher"} onSignOut={() => signOut()} />
  )
}
