import { Link } from 'react-router-dom';
import './Landing.css';

const Landing = () => {
  return (
    <div className="landing-page">
      <div className="landing-hero">
        <div className="landing-copy">
          <span className="eyebrow">ÜCRETLİ QR YÖNLENDİRME</span>
          <h1>Tek bir QR ile Android, iOS ve web yönlendirmesi.</h1>
          <p>
            Uygulamanızı veya linkinizi tek QR üzerinden yönetin. <strong>Yıllık 100 TL</strong> ile tüm platformlarda
            otomatik yönlendirme yapın. Kayıt ol, QR oluştur, kullanıcıyı doğru hedefe gönder.
          </p>
          <div className="landing-actions">
            <Link className="btn btn-primary" to="/login">Hemen Başla</Link>
            <Link className="btn btn-secondary" to="/login">Üye Ol</Link>
          </div>
        </div>
        <div className="landing-info-card">
          <h2>Ne alıyorsun?</h2>
          <ul>
            <li>Android için Google Play yönlendirmesi</li>
            <li>iOS için App Store yönlendirmesi</li>
            <li>Diğer tüm linkler için tek QR</li>
            <li>QR kullanım sayısını takip</li>
            <li>Her QR için yıllık 100 TL plan</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Landing;
