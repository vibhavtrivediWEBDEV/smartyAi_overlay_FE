'use client';

import { useState, useEffect } from 'react';

export default function ResponseStudioPage() {
  const [preferences, setPreferences] = useState({
    language: 'English',
    tone: 'Confident',
    technicalDepth: 70,
    structure: 'Natural'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const token = localStorage.getItem('smartyai_access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/context`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.context?.preferences) {
          const prefs = data.context.preferences;
          setPreferences({
            language: prefs.language || 'en',
            tone: prefs.tone || 'confident',
            technicalDepth: prefs.technicalDepth || 70,
            structure: prefs.structure || 'natural'
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (field: string, value: string | number) => {
    try {
      const token = localStorage.getItem('smartyai_access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/profile/preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ [field]: value })
      });
      
      if (response.ok) {
        fetchPreferences();
      }
    } catch (error) {
      console.error('Failed to update preferences:', error);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Response Studio</h1>
        <p className="text-[#8f887d]">Personalize your AI interview coach</p>
      </div>

      {/* Preferences Card */}
      <div className="bg-[#12120f] rounded-lg border border-white/10 p-8">
        <h3 className="font-bold text-white text-xl mb-2">How should your AI speak?</h3>
        <p className="text-sm text-[#8f887d] mb-8">Choose the default communication style for interview preparation</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Language */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#777066] block mb-3">Preferred Language</label>
            <select 
              value={preferences.language}
              onChange={(e) => updatePreferences('language', e.target.value)}
              className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded focus:border-gold focus:outline-none"
            >
              <option value="en">English</option>
              <option value="hinglish">Hinglish</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          {/* Tone */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#777066] block mb-3">Tone</label>
            <select 
              value={preferences.tone}
              onChange={(e) => updatePreferences('tone', e.target.value)}
              className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded focus:border-gold focus:outline-none"
            >
              <option value="confident">Confident and natural</option>
              <option value="friendly">Friendly and conversational</option>
              <option value="professional">Professional and formal</option>
              <option value="direct">Direct and technical</option>
            </select>
          </div>

          {/* Technical Depth */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#777066] block mb-3">Technical Depth</label>
            <input 
              type="range"
              min="0"
              max="100"
              value={preferences.technicalDepth}
              onChange={(e) => updatePreferences('technicalDepth', e.target.value)}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-[#777066] mt-2">
              <span>Simple</span>
              <span className="text-white font-bold">{preferences.technicalDepth}%</span>
              <span>Advanced</span>
            </div>
          </div>

          {/* Structure */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wide text-[#777066] block mb-3">Answer Structure</label>
            <select 
              value={preferences.structure}
              onChange={(e) => updatePreferences('structure', e.target.value)}
              className="w-full bg-black border border-white/20 text-white px-4 py-3 rounded focus:border-gold focus:outline-none"
            >
              <option value="natural">Natural conversation</option>
              <option value="star">STAR method (Behavioral)</option>
              <option value="definition">Definition → Example → Conclusion</option>
              <option value="step">Explain step by step</option>
            </select>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#12120f] border border-white/10 rounded-lg p-6">
        <p className="text-center text-[#8f887d]">
          💡 Your AI coach will adapt its responses based on these preferences during practice sessions.
        </p>
      </div>
    </div>
  );
}
