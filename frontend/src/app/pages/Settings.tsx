import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Moon, 
  Sun,
  ChevronRight
} from 'lucide-react';
import { Sidebar } from '../components/Sidebar';
import { useDarkMode } from '../components/DarkModeContext';

export function Settings() {
  const { isDarkMode, toggleDarkMode } = useDarkMode();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  const settingsSections = [
    {
      icon: User,
      title: 'Profile',
      description: 'Manage your account information'
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Configure how you receive updates'
    },
    {
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Control your data and security settings'
    },
    {
      icon: Globe,
      title: 'Language & Region',
      description: 'Set your preferred language and location'
    }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${isDarkMode ? 'bg-[#0B1120]' : 'bg-[#F8FAFC]'}`}>
      <Sidebar />
      
      <div className="ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Settings</h1>
            <p className={`transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Manage your account preferences and settings</p>
          </div>

          {/* Quick Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {settingsSections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`rounded-xl border p-6 transition-all duration-300 hover:shadow-2xl text-left group relative overflow-hidden ${
                    isDarkMode 
                      ? 'bg-[#1F2937] border-[#374151] hover:border-[#3B82F6]/30 shadow-lg shadow-[#3B82F6]/5' 
                      : 'bg-white border-[#E2E8F0] hover:border-[#3B82F6]/30 hover:shadow-md'
                  }`}
                >
                  {isDarkMode && (
                    <div className="absolute inset-0 bg-gradient-to-br from-[#3B82F6]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                  <div className="flex items-start justify-between relative z-10">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#3B82F6] to-[#22D3EE] rounded-xl flex items-center justify-center shadow-lg shadow-[#3B82F6]/30">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={`mb-1 font-semibold group-hover:text-[#3B82F6] transition-colors ${
                          isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'
                        }`}>
                          {section.title}
                        </h3>
                        <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 group-hover:translate-x-1 transition-all ${isDarkMode ? 'text-[#9CA3AF] group-hover:text-[#3B82F6]' : 'text-[#94A3B8] group-hover:text-[#3B82F6]'}`} />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Account Information */}
          <div className={`rounded-2xl border p-8 mb-6 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5' 
              : 'bg-white border-[#E2E8F0] shadow-sm'
          }`}>
            <h2 className={`text-xl font-bold mb-6 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className={`text-sm mb-2 block font-medium transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Full Name</label>
                <input
                  type="text"
                  defaultValue="John Doe"
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-[#111827] border-[#374151] text-[#F9FAFB] placeholder-[#6B7280]' 
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
                  }`}
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block font-medium transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Email Address</label>
                <input
                  type="email"
                  defaultValue="john.doe@example.com"
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-[#111827] border-[#374151] text-[#F9FAFB] placeholder-[#6B7280]' 
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
                  }`}
                />
              </div>

              <div>
                <label className={`text-sm mb-2 block font-medium transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Organization</label>
                <input
                  type="text"
                  defaultValue="Tech Company Inc."
                  className={`w-full px-4 py-3 border rounded-xl outline-none focus:border-[#3B82F6] focus:ring-2 focus:ring-[#3B82F6]/20 transition-all duration-200 ${
                    isDarkMode 
                      ? 'bg-[#111827] border-[#374151] text-[#F9FAFB] placeholder-[#6B7280]' 
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A]'
                  }`}
                />
              </div>
            </div>

            <div className="mt-6">
              <button className="px-6 py-3 bg-gradient-to-r from-[#3B82F6] to-[#22D3EE] text-white rounded-xl hover:shadow-2xl hover:shadow-[#3B82F6]/30 transition-all duration-300 font-medium">
                Save Changes
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className={`rounded-2xl border p-8 mb-6 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5' 
              : 'bg-white border-[#E2E8F0] shadow-sm'
          }`}>
            <h2 className={`text-xl font-bold mb-6 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Notification Preferences</h2>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                isDarkMode ? 'bg-[#111827]' : 'bg-[#F8FAFC]'
              }`}>
                <div>
                  <p className={`mb-1 font-medium transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Email Notifications</p>
                  <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Receive verification results via email</p>
                </div>
                <button
                  onClick={() => setEmailNotifications(!emailNotifications)}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                    emailNotifications ? 'bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]' : 'bg-[#374151]'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                    emailNotifications ? 'left-7 shadow-lg shadow-[#3B82F6]/50' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                isDarkMode ? 'bg-[#111827]' : 'bg-[#F8FAFC]'
              }`}>
                <div>
                  <p className={`mb-1 font-medium transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Push Notifications</p>
                  <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Get instant alerts for new verifications</p>
                </div>
                <button
                  onClick={() => setPushNotifications(!pushNotifications)}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                    pushNotifications ? 'bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]' : 'bg-[#374151]'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                    pushNotifications ? 'left-7 shadow-lg shadow-[#3B82F6]/50' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                isDarkMode ? 'bg-[#111827]' : 'bg-[#F8FAFC]'
              }`}>
                <div>
                  <p className={`mb-1 font-medium transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Weekly Report</p>
                  <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Receive a summary of your weekly activity</p>
                </div>
                <button
                  onClick={() => setWeeklyReport(!weeklyReport)}
                  className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                    weeklyReport ? 'bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]' : 'bg-[#374151]'
                  }`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                    weeklyReport ? 'left-7 shadow-lg shadow-[#3B82F6]/50' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div className={`rounded-2xl border p-8 mb-6 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#1F2937] border-[#374151] shadow-lg shadow-[#3B82F6]/5' 
              : 'bg-white border-[#E2E8F0] shadow-sm'
          }`}>
            <h2 className={`text-xl font-bold mb-6 transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Appearance</h2>
            
            <div className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
              isDarkMode ? 'bg-[#111827]' : 'bg-[#F8FAFC]'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  isDarkMode ? 'bg-[#1F2937]' : 'bg-[#0F172A]'
                }`}>
                  {isDarkMode ? (
                    <Moon className="w-5 h-5 text-[#22D3EE]" />
                  ) : (
                    <Sun className="w-5 h-5 text-[#FBBF24]" />
                  )}
                </div>
                <div>
                  <p className={`mb-1 font-medium transition-colors ${isDarkMode ? 'text-[#F9FAFB]' : 'text-[#0F172A]'}`}>Dark Mode</p>
                  <p className={`text-sm transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Switch to {isDarkMode ? 'light' : 'dark'} theme</p>
                </div>
              </div>
              <button
                onClick={toggleDarkMode}
                className={`w-14 h-8 rounded-full transition-all duration-300 relative ${
                  isDarkMode ? 'bg-gradient-to-r from-[#3B82F6] to-[#22D3EE]' : 'bg-[#CBD5E1]'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full absolute top-1 transition-all duration-300 ${
                  isDarkMode ? 'left-7 shadow-lg shadow-[#3B82F6]/50' : 'left-1'
                }`} />
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className={`rounded-2xl p-8 border-2 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-[#7F1D1D]/20 to-[#450A0A]/10 border-[#DC2626]/40' 
              : 'bg-gradient-to-br from-[#FEE2E2] to-[#FEF2F2] border-[#FCA5A5]'
          }`}>
            <h2 className={`text-xl font-bold mb-2 transition-colors ${isDarkMode ? 'text-[#FCA5A5]' : 'text-[#991B1B]'}`}>Danger Zone</h2>
            <p className={`mb-6 transition-colors ${isDarkMode ? 'text-[#9CA3AF]' : 'text-[#64748B]'}`}>Irreversible and destructive actions</p>
            
            <div className="space-y-3">
              <button className={`w-full px-4 py-3 border rounded-xl transition-all duration-200 text-left font-medium ${
                isDarkMode 
                  ? 'bg-[#111827] border-[#DC2626]/40 text-[#FCA5A5] hover:bg-[#7F1D1D]/20' 
                  : 'bg-white border-[#FCA5A5] text-[#EF4444] hover:bg-[#FEF2F2]'
              }`}>
                Delete All Verification History
              </button>
              <button className="w-full px-4 py-3 bg-[#EF4444] text-white rounded-xl hover:bg-[#DC2626] hover:shadow-2xl hover:shadow-[#EF4444]/30 transition-all duration-200 text-left font-medium">
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}