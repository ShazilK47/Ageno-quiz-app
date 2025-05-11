"use client";

import React, { useState, useEffect } from "react";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { handleFirebaseError } from "@/firebase/utils";
import AdminProtected from "@/components/AdminProtected";
import Header from "@/components/Header";

interface AppSettings {
  allowPublicRegistration: boolean;
  requireEmailVerification: boolean;
  defaultQuizTimeLimit: number;
  maintenanceMode: boolean;
  siteTitle: string;
  footerText: string;
  customCss: string;
  enableLeaderboard: boolean;
  showCorrectAnswers: boolean;
  quizAttemptsLimit: number;
  autogradeQuizzes: boolean;
  adminContactEmail: string;
  termsUrl: string;
  privacyUrl: string;
}

const defaultSettings: AppSettings = {
  allowPublicRegistration: true,
  requireEmailVerification: true,
  defaultQuizTimeLimit: 30,
  maintenanceMode: false,
  siteTitle: "Ageno Quiz App",
  footerText: "© 2025 Ageno Quiz App. All rights reserved.",
  customCss: "",
  enableLeaderboard: true,
  showCorrectAnswers: true,
  quizAttemptsLimit: 1,
  autogradeQuizzes: true,
  adminContactEmail: "admin@example.com",
  termsUrl: "",
  privacyUrl: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("general");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const settingsRef = doc(db, "settings", "app");
      const settingsSnapshot = await getDoc(settingsRef);

      if (settingsSnapshot.exists()) {
        const settingsData = settingsSnapshot.data() as AppSettings;
        setSettings({
          ...defaultSettings,
          ...settingsData,
        });
      } else {
        // If settings don't exist, use defaults and create in Firestore
        await setDoc(settingsRef, defaultSettings);
      }
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error fetching settings:", formattedError);
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setSettings({
        ...settings,
        [name]: checked,
      });
    } else if (type === "number") {
      setSettings({
        ...settings,
        [name]: parseInt(value, 10),
      });
    } else {
      setSettings({
        ...settings,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const settingsRef = doc(db, "settings", "app");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await updateDoc(settingsRef, settings as { [key: string]: any });
      setSuccess("Settings saved successfully");

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error saving settings:", formattedError);
      setError(formattedError.message);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (
      window.confirm(
        "Are you sure you want to reset all settings to defaults? This cannot be undone."
      )
    ) {
      try {
        setSaving(true);
        setError(null);

        const settingsRef = doc(db, "settings", "app");
        await setDoc(settingsRef, defaultSettings);

        setSettings(defaultSettings);
        setSuccess("Settings have been reset to defaults");

        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } catch (err) {
        const formattedError = handleFirebaseError(err);
        console.error("Error resetting settings:", formattedError);
        setError(formattedError.message);
      } finally {
        setSaving(false);
      }
    }
  }; // Determines if a particular tab should be shown
  interface TabContentProps {
    id: string;
    children: React.ReactNode;
  }

  const TabContent: React.FC<TabContentProps> = ({ id, children }) => {
    return (
      <div className={`${activeTab === id ? "block" : "hidden"}`}>
        {children}
      </div>
    );
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <AdminProtected
          fallback={
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                You need administrator privileges to view this page
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please contact an administrator if you need access.
              </p>
            </div>
          }
        >
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">App Settings</h1>
            <p className="text-gray-600 mt-2">
              Configure global settings for the Ageno Quiz application
            </p>
          </div>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm">
              {error && (
                <div className="p-4 mb-4 bg-red-50 border-l-4 border-red-500 text-red-700">
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="p-4 mb-4 bg-green-50 border-l-4 border-green-500 text-green-700">
                  <p>{success}</p>
                </div>
              )}

              {/* Settings Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === "general"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("general")}
                  >
                    General
                  </button>
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === "quiz"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("quiz")}
                  >
                    Quiz Settings
                  </button>
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === "users"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("users")}
                  >
                    User Settings
                  </button>
                  <button
                    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === "appearance"
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                    onClick={() => setActiveTab("appearance")}
                  >
                    Appearance
                  </button>
                </nav>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="p-6">
                  {" "}
                  {/* General Settings */}
                  <TabContent id="general">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      General Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label
                          htmlFor="siteTitle"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Site Title
                        </label>
                        <input
                          type="text"
                          id="siteTitle"
                          name="siteTitle"
                          value={settings.siteTitle}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          This will appear in the browser title bar and email
                          templates
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="adminContactEmail"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Admin Contact Email
                        </label>
                        <input
                          type="email"
                          id="adminContactEmail"
                          name="adminContactEmail"
                          value={settings.adminContactEmail}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Where users can reach site administrators
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <label
                        htmlFor="footerText"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Footer Text
                      </label>
                      <input
                        type="text"
                        id="footerText"
                        name="footerText"
                        value={settings.footerText}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Text displayed at the bottom of every page
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label
                          htmlFor="termsUrl"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Terms of Service URL
                        </label>
                        <input
                          type="url"
                          id="termsUrl"
                          name="termsUrl"
                          value={settings.termsUrl}
                          onChange={handleChange}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="privacyUrl"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Privacy Policy URL
                        </label>
                        <input
                          type="url"
                          id="privacyUrl"
                          name="privacyUrl"
                          value={settings.privacyUrl}
                          onChange={handleChange}
                          placeholder="https://..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="maintenanceMode"
                            name="maintenanceMode"
                            checked={settings.maintenanceMode}
                            onChange={handleChange}
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="maintenanceMode"
                            className="font-medium text-gray-700"
                          >
                            Enable Maintenance Mode
                          </label>
                          <p className="text-gray-500">
                            When enabled, only administrators can access the
                            site
                          </p>
                        </div>
                      </div>{" "}
                    </div>
                  </TabContent>
                  {/* Quiz Settings */}
                  <TabContent id="quiz">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Quiz Settings
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label
                          htmlFor="defaultQuizTimeLimit"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Default Quiz Time Limit (minutes)
                        </label>
                        <input
                          type="number"
                          id="defaultQuizTimeLimit"
                          name="defaultQuizTimeLimit"
                          min="1"
                          max="180"
                          value={settings.defaultQuizTimeLimit}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          Default time limit for new quizzes
                        </p>
                      </div>

                      <div>
                        <label
                          htmlFor="quizAttemptsLimit"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Default Quiz Attempts Limit
                        </label>
                        <input
                          type="number"
                          id="quizAttemptsLimit"
                          name="quizAttemptsLimit"
                          min="1"
                          max="100"
                          value={settings.quizAttemptsLimit}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                        />
                        <p className="mt-1 text-sm text-gray-500">
                          How many times a user can take the same quiz
                        </p>
                      </div>
                    </div>

                    <div className="mb-6">
                      <div className="relative flex items-start mb-4">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="autogradeQuizzes"
                            name="autogradeQuizzes"
                            checked={settings.autogradeQuizzes}
                            onChange={handleChange}
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="autogradeQuizzes"
                            className="font-medium text-gray-700"
                          >
                            Auto-grade Quizzes
                          </label>
                          <p className="text-gray-500">
                            Automatically grade quizzes when submitted
                          </p>
                        </div>
                      </div>
                      <div className="relative flex items-start mb-4">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="showCorrectAnswers"
                            name="showCorrectAnswers"
                            checked={settings.showCorrectAnswers}
                            onChange={handleChange}
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="showCorrectAnswers"
                            className="font-medium text-gray-700"
                          >
                            Show Correct Answers
                          </label>
                          <p className="text-gray-500">
                            Show correct answers to students after quiz
                            completion
                          </p>
                        </div>
                      </div>
                      <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="enableLeaderboard"
                            name="enableLeaderboard"
                            checked={settings.enableLeaderboard}
                            onChange={handleChange}
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="enableLeaderboard"
                            className="font-medium text-gray-700"
                          >
                            Enable Leaderboard
                          </label>
                          <p className="text-gray-500">
                            Display a leaderboard of top-scoring students
                          </p>
                        </div>
                      </div>{" "}
                    </div>
                  </TabContent>
                  {/* User Settings */}
                  <TabContent id="users">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      User Settings
                    </h2>

                    <div className="mb-6">
                      <div className="relative flex items-start mb-4">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="allowPublicRegistration"
                            name="allowPublicRegistration"
                            checked={settings.allowPublicRegistration}
                            onChange={handleChange}
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="allowPublicRegistration"
                            className="font-medium text-gray-700"
                          >
                            Allow Public Registration
                          </label>
                          <p className="text-gray-500">
                            Anyone can create an account (if disabled, only
                            admins can create users)
                          </p>
                        </div>
                      </div>

                      <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            id="requireEmailVerification"
                            name="requireEmailVerification"
                            checked={settings.requireEmailVerification}
                            onChange={handleChange}
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label
                            htmlFor="requireEmailVerification"
                            className="font-medium text-gray-700"
                          >
                            Require Email Verification
                          </label>
                          <p className="text-gray-500">
                            Users must verify their email address before they
                            can use the app
                          </p>
                        </div>
                      </div>
                    </div>
                  </TabContent>{" "}
                  {/* Appearance Settings */}
                  <TabContent id="appearance">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">
                      Appearance Settings
                    </h2>

                    <div className="mb-6">
                      <label
                        htmlFor="customCss"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Custom CSS
                      </label>
                      <textarea
                        id="customCss"
                        name="customCss"
                        rows={8}
                        value={settings.customCss}
                        onChange={handleChange}
                        placeholder="/* Add your custom CSS here */"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 font-mono text-sm"
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Add custom CSS styles to your site (advanced users only)
                      </p>
                    </div>
                  </TabContent>
                  <div className="mt-8 flex justify-between">
                    <button
                      type="button"
                      onClick={resetToDefaults}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Reset to Defaults
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center px-6 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-purple-400"
                    >
                      {saving ? "Saving..." : "Save Settings"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}{" "}
        </AdminProtected>
      </div>
    </>
  );
}
