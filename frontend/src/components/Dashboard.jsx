import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { QRCodeCanvas } from 'qrcode.react';
import { AuthContext } from '../App';
import './Dashboard.css';

const Dashboard = () => {
  const { token, user, logout } = useContext(AuthContext);
  const [qrCodes, setQrCodes] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    android: '',
    ios: '',
    default: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchQRCodes();
  }, [token]);

  const fetchQRCodes = async () => {
    try {
      const response = await axios.get('/api/qr/list', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQrCodes(response.data.qrCodes);
    } catch (err) {
      setError('QR kodları yüklenirken hata oluştu');
    }
  };

  const handleCreateQR = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await axios.post(
        '/api/qr/create',
        {
          name: formData.name,
          redirect_urls: {
            android: formData.android,
            ios: formData.ios,
            default: formData.default,
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('✅ QR kodu başarıyla oluşturuldu!');
      setFormData({ name: '', android: '', ios: '', default: '' });
      fetchQRCodes();
    } catch (err) {
      setError(err.response?.data?.message || 'Hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQR = async (id) => {
    if (window.confirm('Bu QR kodunu silmek istediğinize emin misiniz?')) {
      try {
        await axios.delete(`/api/qr/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('✅ QR kodu silindi');
        fetchQRCodes();
      } catch (err) {
        setError('Silme hatası');
      }
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="logo">🚀 QR Router</div>
        <div className="user-info">
          <span>{user?.username}</span>
          <button onClick={logout} className="logout-btn">Çıkış</button>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="create-section">
          <h2>Yeni QR Kodu Oluştur</h2>
          
          {error && <div className="alert error">{error}</div>}
          {success && <div className="alert success">{success}</div>}

          <form onSubmit={handleCreateQR} className="qr-form">
            <div className="form-group">
              <label>QR Kodu Adı</label>
              <input
                type="text"
                placeholder="Örn: YouTube Linki"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Android Uygulaması (Google Play Link)</label>
              <input
                type="url"
                placeholder="https://play.google.com/store/apps/details?id=..."
                value={formData.android}
                onChange={(e) => setFormData({...formData, android: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>iOS Uygulaması (App Store Link)</label>
              <input
                type="url"
                placeholder="https://apps.apple.com/app/..."
                value={formData.ios}
                onChange={(e) => setFormData({...formData, ios: e.target.value})}
              />
            </div>

            <div className="form-group">
              <label>Varsayılan Link (Diğer Platformlar)</label>
              <input
                type="url"
                placeholder="https://example.com"
                value={formData.default}
                onChange={(e) => setFormData({...formData, default: e.target.value})}
              />
            </div>

            <button type="submit" disabled={loading} className="create-btn">
              {loading ? 'Oluşturuluyor...' : '➕ QR Kodu Oluştur'}
            </button>
          </form>
        </div>

        <div className="qr-list-section">
          <h2>Oluşturduğun QR Kodları ({qrCodes.length})</h2>
          
          {qrCodes.length === 0 ? (
            <p className="empty-message">Henüz QR kodu oluşturmadın</p>
          ) : (
            <div className="qr-grid">
              {qrCodes.map(qr => (
                <div key={qr.id} className="qr-card">
                  <h3>{qr.name}</h3>
                  <div className="qr-preview">
                    <QRCodeCanvas value={qr.slug} size={200} />
                  </div>
                  <div className="qr-info">
                    <p><strong>Slug:</strong> {qr.slug}</p>
                    <p><strong>Tarama:</strong> {qr.scansCount}</p>
                    <p><strong>Oluşturulma:</strong> {new Date(qr.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteQR(qr.id)}
                    className="delete-btn"
                  >
                    🗑️ Sil
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
