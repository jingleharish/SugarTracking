import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, BarChart, Bar } from 'recharts';
import { Activity, TrendingUp, TrendingDown, Calendar, Plus, Trash2, Lock, Eye, LogOut, AlertCircle, Syringe, RefreshCw } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbwU_tUwW34K-xKiRcJBI5jK1tcDzu8IH70i5WeYbbXlmfC2C1U_S4X1JSqB7ghr7JXBdQ/exec';

export default function SugarTracker() {
	const [accessMode, setAccessMode] = useState(null);
	const [showAdminLogin, setShowAdminLogin] = useState(false);
	const [credentials, setCredentials] = useState({ username: '', password: '' });
	const [loginError, setLoginError] = useState('');
	const [readings, setReadings] = useState([]);
	const [insulinLog, setInsulinLog] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [newReading, setNewReading] = useState({
		date: new Date().toISOString().split('T')[0],
		timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5),
		time: 'fasting',
		value: '',
		notes: ''
	});
	const [newInsulin, setNewInsulin] = useState({
		date: new Date().toISOString().split('T')[0],
		morning: '',
		night: '',
		notes: ''
	});

	// Load data from Google Sheets on component mount
	useEffect(() => {
		if (accessMode) {
			loadData();
		}
	}, [accessMode]);

	const loadData = async () => {
		setLoading(true);
		setError('');
		try {
			// Fetch blood sugar data
			console.log('Fetching blood sugar data from:', `${API_URL}?action=getBloodSugar`);
			const bloodSugarResponse = await fetch(`${API_URL}?action=getBloodSugar`, {
				method: 'GET',
				redirect: 'follow'
			});
			console.log('Blood sugar response status:', bloodSugarResponse.status);
			const bloodSugarText = await bloodSugarResponse.text();
			console.log('Blood sugar raw response:', bloodSugarText);
			const bloodSugarData = JSON.parse(bloodSugarText);
      
			// Fetch insulin data
			console.log('Fetching insulin data from:', `${API_URL}?action=getInsulin`);
			const insulinResponse = await fetch(`${API_URL}?action=getInsulin`, {
				method: 'GET',
				redirect: 'follow'
			});
			console.log('Insulin response status:', insulinResponse.status);
			const insulinText = await insulinResponse.text();
			console.log('Insulin raw response:', insulinText);
			const insulinData = JSON.parse(insulinText);
      
			if (bloodSugarData.error) {
				setError(`Blood Sugar: ${bloodSugarData.error}`);
			} else {
				setReadings(Array.isArray(bloodSugarData) ? bloodSugarData : []);
			}
      
			if (insulinData.error) {
				setError(prev => prev + ` Insulin: ${insulinData.error}`);
			} else {
				setInsulinLog(Array.isArray(insulinData) ? insulinData : []);
			}
      
			console.log('Data loaded successfully:', { 
				bloodSugarCount: bloodSugarData.length, 
				insulinCount: insulinData.length 
			});
		} catch (err) {
			const errorMsg = `Failed to load data: ${err.message}. Check browser console for details.`;
			setError(errorMsg);
			console.error('Error loading data:', err);
			console.error('Error details:', {
				message: err.message,
				stack: err.stack,
				apiUrl: API_URL
			});
		} finally {
			setLoading(false);
		}
	};

	const handleAdminLogin = () => {
		if (credentials.username === 'admin' && credentials.password === 'G00gle2025') {
			setAccessMode('admin');
			setShowAdminLogin(false);
			setLoginError('');
			setCredentials({ username: '', password: '' });
		} else {
			setLoginError('Invalid username or password');
		}
	};

	const handleKeyPress = (e) => {
		if (e.key === 'Enter') {
			handleAdminLogin();
		}
	};

	const addReading = async () => {
		if (newReading.value && newReading.date) {
			setLoading(true);
			try {
				const response = await fetch(API_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'addBloodSugar',
						date: newReading.date,
						timestamp: newReading.timestamp,
						time: newReading.time,
						value: parseFloat(newReading.value),
						notes: newReading.notes
					})
				});
        
				const result = await response.json();
				if (result.success) {
					await loadData();
					setNewReading({
						date: new Date().toISOString().split('T')[0],
						timestamp: new Date().toTimeString().split(' ')[0].substring(0, 5),
						time: 'fasting',
						value: '',
						notes: ''
					});
				} else {
					setError('Failed to add reading');
				}
			} catch (err) {
				setError('Failed to save data. Please try again.');
				console.error('Error adding reading:', err);
			} finally {
				setLoading(false);
			}
		}
	};

	const addInsulin = async () => {
		if (newInsulin.date && (newInsulin.morning || newInsulin.night)) {
			setLoading(true);
			try {
				const response = await fetch(API_URL, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						action: 'addInsulin',
						date: newInsulin.date,
						morning: newInsulin.morning ? parseFloat(newInsulin.morning) : 0,
						night: newInsulin.night ? parseFloat(newInsulin.night) : 0,
						notes: newInsulin.notes
					})
				});
        
				const result = await response.json();
				if (result.success) {
					await loadData();
					setNewInsulin({
						date: new Date().toISOString().split('T')[0],
						morning: '',
						night: '',
						notes: ''
					});
				} else {
					setError('Failed to add insulin record');
				}
			} catch (err) {
				setError('Failed to save data. Please try again.');
				console.error('Error adding insulin:', err);
			} finally {
				setLoading(false);
			}
		}
	};

	const deleteReading = async (id) => {
		if (!confirm('Are you sure you want to delete this reading?')) return;
    
		setLoading(true);
		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'deleteBloodSugar',
					id: id
				})
			});
      
			const result = await response.json();
			if (result.success) {
				await loadData();
			} else {
				setError('Failed to delete reading');
			}
		} catch (err) {
			setError('Failed to delete. Please try again.');
			console.error('Error deleting reading:', err);
		} finally {
			setLoading(false);
		}
	};

	const deleteInsulin = async (id) => {
		if (!confirm('Are you sure you want to delete this insulin record?')) return;
    
		setLoading(true);
		try {
			const response = await fetch(API_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'deleteInsulin',
					id: id
				})
			});
      
			const result = await response.json();
			if (result.success) {
				await loadData();
			} else {
				setError('Failed to delete insulin record');
			}
		} catch (err) {
			setError('Failed to delete. Please try again.');
			console.error('Error deleting insulin:', err);
		} finally {
			setLoading(false);
		}
	};

	const logout = () => {
		setAccessMode(null);
		setShowAdminLogin(false);
		setCredentials({ username: '', password: '' });
		setLoginError('');
	};

	const getAnalytics = () => {
		if (readings.length === 0) return null;

		const values = readings.map(r => parseFloat(r.value)).filter(v => !isNaN(v));
		const avg = values.reduce((a, b) => a + b, 0) / values.length;
		const min = Math.min(...values);
		const max = Math.max(...values);
    
		const last7Days = readings.slice(-7);
		const prev7Days = readings.slice(-14, -7);
    
		const avg7 = last7Days.length > 0 
			? last7Days.reduce((a, b) => a + parseFloat(b.value), 0) / last7Days.length 
			: 0;
		const avgPrev7 = prev7Days.length > 0 
			? prev7Days.reduce((a, b) => a + parseFloat(b.value), 0) / prev7Days.length 
			: 0;
    
		const trend = avg7 - avgPrev7;
    
		const inRange = readings.filter(r => parseFloat(r.value) >= 70 && parseFloat(r.value) <= 140).length;
		const rangePercent = (inRange / readings.length) * 100;

		return { avg, min, max, trend, rangePercent, total: readings.length };
	};

	const getInsulinStats = () => {
		if (insulinLog.length === 0) return null;

		const morningDoses = insulinLog.filter(i => i.morning > 0).map(i => parseFloat(i.morning));
		const nightDoses = insulinLog.filter(i => i.night > 0).map(i => parseFloat(i.night));

		const avgMorning = morningDoses.length > 0 
			? morningDoses.reduce((a, b) => a + b, 0) / morningDoses.length 
			: 0;
		const avgNight = nightDoses.length > 0 
			? nightDoses.reduce((a, b) => a + b, 0) / nightDoses.length 
			: 0;

		return { avgMorning, avgNight, totalEntries: insulinLog.length };
	};

	const analytics = getAnalytics();
	const insulinStats = getInsulinStats();

	const chartData = readings.slice(-30).map(r => ({
		date: new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
		value: parseFloat(r.value),
		time: r.time
	}));

	const insulinChartData = insulinLog.slice(-10).map(i => ({
		date: new Date(i.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
		morning: parseFloat(i.morning) || 0,
		night: parseFloat(i.night) || 0
	}));

	if (showAdminLogin) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
					<div className="flex items-center justify-center gap-3 mb-6">
						<Lock className="w-12 h-12 text-indigo-600" />
						<h1 className="text-3xl font-bold text-gray-800">Admin Login</h1>
					</div>
          
					<div className="space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
							<input
								type="text"
								value={credentials.username}
								onChange={(e) => setCredentials({...credentials, username: e.target.value})}
								onKeyPress={handleKeyPress}
								className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
								placeholder="Enter username"
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
							<input
								type="password"
								value={credentials.password}
								onChange={(e) => setCredentials({...credentials, password: e.target.value})}
								onKeyPress={handleKeyPress}
								className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
								placeholder="Enter password"
							/>
						</div>

						{loginError && (
							<div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
								<AlertCircle className="w-5 h-5" />
								<span className="text-sm font-medium">{loginError}</span>
							</div>
						)}

						<button
							onClick={handleAdminLogin}
							className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg"
						>
							Login
						</button>

						<button
							onClick={() => {
								setShowAdminLogin(false);
								setLoginError('');
								setCredentials({ username: '', password: '' });
							}}
							className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
						>
							Back
						</button>
					</div>
				</div>
			</div>
		);
	}

	if (!accessMode) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
				<div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
					<div className="flex items-center justify-center gap-3 mb-4">
						<Activity className="w-12 h-12 text-indigo-600" />
						<h1 className="text-3xl font-bold text-gray-800">Blood Sugar Tracker</h1>
					</div>
					<div className="text-center mb-6">
						<p className="text-xl font-semibold text-indigo-600">Patient: Muniyappa B V</p>
					</div>
          
					<p className="text-center text-gray-600 mb-8">Select your access level to continue</p>
          
					<div className="space-y-4">
						<button
							onClick={() => setShowAdminLogin(true)}
							className="w-full px-6 py-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg"
						>
							<Lock className="w-6 h-6" />
							<div className="text-left">
								<div>Admin Access</div>
								<div className="text-sm opacity-75">Add & Edit Data</div>
							</div>
						</button>
            
						<button
							onClick={() => setAccessMode('viewer')}
							className="w-full px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold text-lg flex items-center justify-center gap-3 shadow-lg"
						>
							<Eye className="w-6 h-6" />
							<div className="text-left">
								<div>View Only Access</div>
								<div className="text-sm opacity-75">No Login Required</div>
							</div>
						</button>
					</div>
          
					<div className="mt-6 p-4 bg-blue-50 rounded-lg">
						<p className="text-sm text-gray-700"><strong>Admin:</strong> Requires login to add, edit, and delete readings</p>
						<p className="text-sm text-gray-700 mt-2"><strong>Viewer:</strong> No login needed, can only view data and analytics</p>
						<p className="text-xs text-gray-600 mt-3">✅ Data synced with Google Sheets</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
			<div className="max-w-6xl mx-auto">
				<div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-3">
							<Activity className="w-8 h-8 text-indigo-600" />
							<div>
								<h1 className="text-3xl font-bold text-gray-800">Blood Sugar Tracker</h1>
								<p className="text-sm text-gray-600 mt-1">Patient: <span className="font-semibold text-indigo-600">Muniyappa B V</span></p>
								<div className="flex items-center gap-2 mt-1">
									{accessMode === 'admin' ? (
										<span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold flex items-center gap-1">
											<Lock className="w-4 h-4" />
											Admin Mode
										</span>
									) : (
										<span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold flex items-center gap-1">
											<Eye className="w-4 h-4" />
											View Only Mode
										</span>
									)}
									<span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs">
										📊 Synced with Google Sheets
									</span>
								</div>
							</div>
						</div>
						<div className="flex gap-2">
							<button
								onClick={loadData}
								disabled={loading}
								className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold flex items-center gap-2"
							>
								<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
								Refresh
							</button>
							<button
								onClick={logout}
								className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold flex items-center gap-2"
							>
								<LogOut className="w-4 h-4" />
								Logout
							</button>
						</div>
					</div>

					{error && (
						<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
							<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
							<div>
								<p className="text-sm font-semibold text-red-800">Error</p>
								<p className="text-sm text-red-700">{error}</p>
							</div>
						</div>
					)}

					{loading && (
						<div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
							<RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
							<p className="text-sm text-blue-700">Syncing with Google Sheets...</p>
						</div>
					)}

					{accessMode === 'admin' && (
						<>
							<div className="bg-indigo-50 rounded-xl p-6 mb-6">
								<h2 className="text-xl font-semibold text-gray-700 mb-4">Add Blood Sugar Reading</h2>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
										<input
											type="date"
											value={newReading.date}
											onChange={(e) => setNewReading({...newReading, date: e.target.value})}
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
										<input
											type="time"
											value={newReading.timestamp}
											onChange={(e) => setNewReading({...newReading, timestamp: e.target.value})}
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
										/>
									</div>
                  
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Meal Time</label>
										<select
											value={newReading.time}
											onChange={(e) => setNewReading({...newReading, time: e.target.value})}
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
										>
											<option value="fasting">Fasting</option>
											<option value="before-breakfast">Before Breakfast</option>
											<option value="after-breakfast">After Breakfast</option>
											<option value="before-lunch">Before Lunch</option>
											<option value="after-lunch">After Lunch</option>
											<option value="before-dinner">Before Dinner</option>
											<option value="after-dinner">After Dinner</option>
											<option value="bedtime">Bedtime</option>
										</select>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Sugar Level (mg/dL)</label>
										<input
											type="number"
											value={newReading.value}
											onChange={(e) => setNewReading({...newReading, value: e.target.value})}
											placeholder="Enter value"
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
										<input
											type="text"
											value={newReading.notes}
											onChange={(e) => setNewReading({...newReading, notes: e.target.value})}
											placeholder="Add notes"
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
										/>
									</div>
								</div>

								<button
									onClick={addReading}
									disabled={loading}
									className="mt-4 w-full md:w-auto px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
								>
									<Plus className="w-5 h-5" />
									Add Reading
								</button>
							</div>

							<div className="bg-purple-50 rounded-xl p-6 mb-6">
								<div className="flex items-center gap-2 mb-4">
									<Syringe className="w-6 h-6 text-purple-600" />
									<h2 className="text-xl font-semibold text-gray-700">Add Insulin Intake</h2>
								</div>
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
										<input
											type="date"
											value={newInsulin.date}
											onChange={(e) => setNewInsulin({...newInsulin, date: e.target.value})}
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Morning Dose (units)</label>
										<input
											type="number"
											value={newInsulin.morning}
											onChange={(e) => setNewInsulin({...newInsulin, morning: e.target.value})}
											placeholder="Enter units"
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Night Dose (units)</label>
										<input
											type="number"
											value={newInsulin.night}
											onChange={(e) => setNewInsulin({...newInsulin, night: e.target.value})}
											placeholder="Enter units"
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
										/>
									</div>

									<div>
										<label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
										<input
											type="text"
											value={newInsulin.notes}
											onChange={(e) => setNewInsulin({...newInsulin, notes: e.target.value})}
											placeholder="Add notes"
											className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
										/>
									</div>
								</div>

								<button
									onClick={addInsulin}
									disabled={loading}
									className="mt-4 w-full md:w-auto px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50"
								>
									<Plus className="w-5 h-5" />
									Add Insulin Record
								</button>
							</div>
						</>
					)}

					{accessMode === 'viewer' && (readings.length > 0 || insulinLog.length > 0) && (
						<div className="bg-green-50 border-l-4 border-green-500 rounded-lg p-4 mb-6">
							<div className="flex items-center gap-2">
								<Eye className="w-5 h-5 text-green-700" />
								<p className="text-green-700 font-semibold">
									You're in View Only mode. Logout and login as Admin to add or modify readings.
								</p>
							</div>
						</div>
					)}

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
						{analytics && (
							<>
								<div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
									<div className="text-sm opacity-90 mb-1">Average Sugar</div>
									<div className="text-3xl font-bold">{analytics.avg.toFixed(1)}</div>
									<div className="text-xs opacity-75 mt-1">mg/dL</div>
								</div>

								<div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-5 text-white">
									<div className="text-sm opacity-90 mb-1">In Range</div>
									<div className="text-3xl font-bold">{analytics.rangePercent.toFixed(0)}%</div>
									<div className="text-xs opacity-75 mt-1">70-140 mg/dL</div>
								</div>

								<div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-5 text-white">
									<div className="text-sm opacity-90 mb-1">Highest</div>
									<div className="text-3xl font-bold">{analytics.max}</div>
									<div className="text-xs opacity-75 mt-1">mg/dL</div>
								</div>
							</>
						)}

						{insulinStats && (
							<>
								<div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
									<div className="text-sm opacity-90 mb-1">Avg Morning</div>
									<div className="text-3xl font-bold">{insulinStats.avgMorning.toFixed(1)}</div>
									<div className="text-xs opacity-75 mt-1">units</div>
								</div>

								<div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-5 text-white">
									<div className="text-sm opacity-90 mb-1">Avg Night</div>
									<div className="text-3xl font-bold">{insulinStats.avgNight.toFixed(1)}</div>
									<div className="text-xs opacity-75 mt-1">units</div>
								</div>
							</>
						)}
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
						{readings.length > 0 && (
							<div className="bg-gray-50 rounded-xl p-6">
								<h2 className="text-xl font-semibold text-gray-700 mb-4">Sugar Level Trends (Last 30 Days)</h2>
								<ResponsiveContainer width="100%" height={250}>
									<AreaChart data={chartData}>
										<defs>
											<linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
												<stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" style={{fontSize: '12px'}} />
										<YAxis style={{fontSize: '12px'}} />
										<Tooltip />
										<Area type="monotone" dataKey="value" stroke="#6366f1" fillOpacity={1} fill="url(#colorValue)" />
										<Line type="monotone" dataKey={() => 70} stroke="#22c55e" strokeDasharray="5 5" dot={false} />
										<Line type="monotone" dataKey={() => 140} stroke="#22c55e" strokeDasharray="5 5" dot={false} />
									</AreaChart>
								</ResponsiveContainer>
							</div>
						)}

						{insulinLog.length > 0 && (
							<div className="bg-gray-50 rounded-xl p-6">
								<h2 className="text-xl font-semibold text-gray-700 mb-4">Insulin Intake (Last 10 Days)</h2>
								<ResponsiveContainer width="100%" height={250}>
									<BarChart data={insulinChartData}>
										<CartesianGrid strokeDasharray="3 3" />
										<XAxis dataKey="date" style={{fontSize: '12px'}} />
										<YAxis style={{fontSize: '12px'}} />
										<Tooltip />
										<Legend />
										<Bar dataKey="morning" fill="#a855f7" name="Morning" />
										<Bar dataKey="night" fill="#ec4899" name="Night" />
									</BarChart>
								</ResponsiveContainer>
							</div>
						)}
					</div>

					{insulinLog.length > 0 && (
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
								<Syringe className="w-5 h-5 text-purple-600" />
								Insulin Intake Log
							</h2>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-purple-100">
										<tr>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Morning (units)</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Night (units)</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total (units)</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
											{accessMode === 'admin' && (
												<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
											)}
										</tr>
									</thead>
									<tbody>
										{insulinLog.slice().reverse().map((insulin) => (
											<tr key={insulin.id} className="border-b hover:bg-gray-50">
												<td className="px-4 py-3 text-sm">
													{new Date(insulin.date).toLocaleDateString()}
												</td>
												<td className="px-4 py-3 text-sm font-semibold text-purple-600">
													{insulin.morning || '-'}
												</td>
												<td className="px-4 py-3 text-sm font-semibold text-pink-600">
													{insulin.night || '-'}
												</td>
												<td className="px-4 py-3 text-sm font-bold">
													{parseFloat(insulin.morning || 0) + parseFloat(insulin.night || 0)}
												</td>
												<td className="px-4 py-3 text-sm text-gray-600">
													{insulin.notes || '-'}
												</td>
												{accessMode === 'admin' && (
													<td className="px-4 py-3">
														<button
															onClick={() => deleteInsulin(insulin.id)}
															disabled={loading}
															className="text-red-600 hover:text-red-800 disabled:opacity-50"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</td>
												)}
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{readings.length > 0 && (
						<div>
							<h2 className="text-xl font-semibold text-gray-700 mb-4">Blood Sugar Readings</h2>
							<div className="overflow-x-auto">
								<table className="w-full">
									<thead className="bg-gray-100">
										<tr>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Time</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Meal Time</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Level (mg/dL)</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
											<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Notes</th>
											{accessMode === 'admin' && (
												<th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Action</th>
											)}
										</tr>
									</thead>
									<tbody>
										{readings.slice().reverse().map((reading) => {
											const value = parseFloat(reading.value);
											let status = 'Normal';
											let statusColor = 'text-green-600 bg-green-100';
                      
											if (value < 70) {
												status = 'Low';
												statusColor = 'text-orange-600 bg-orange-100';
											} else if (value > 140) {
												status = 'High';
												statusColor = 'text-red-600 bg-red-100';
											}
                      
											return (
												<tr key={reading.id} className="border-b hover:bg-gray-50">
													<td className="px-4 py-3 text-sm">
														{new Date(reading.date).toLocaleDateString()}
													</td>
													<td className="px-4 py-3 text-sm font-semibold">
														{reading.timestamp}
													</td>
													<td className="px-4 py-3 text-sm capitalize">
														{reading.time ? reading.time.replace(/-/g, ' ') : '-'}
													</td>
													<td className="px-4 py-3 text-sm font-semibold">
														{value}
													</td>
													<td className="px-4 py-3 text-sm">
														<span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
															{status}
														</span>
													</td>
													<td className="px-4 py-3 text-sm text-gray-600">
														{reading.notes || '-'}
													</td>
													{accessMode === 'admin' && (
														<td className="px-4 py-3">
															<button
																onClick={() => deleteReading(reading.id)}
																disabled={loading}
																className="text-red-600 hover:text-red-800 disabled:opacity-50"
															>
																<Trash2 className="w-4 h-4" />
															</button>
														</td>
													)}
												</tr>
											);
										})}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{readings.length === 0 && insulinLog.length === 0 && !loading && (
						<div className="text-center py-12 text-gray-500">
							<Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
							<p className="text-lg">No data found in Google Sheets. {accessMode === 'admin' ? 'Add your first reading or insulin record above!' : 'Login as Admin to add data.'}</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
