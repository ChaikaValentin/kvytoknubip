import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'

const FAQ = [
  {
    q: 'Як отримати квиток після оплати?',
    a: 'Одразу після оплати квитки з QR-кодами з\'являться на сторінці «Мої квитки» та на екрані підтвердження. Покажіть QR-код на вході до залу.'
  },
  {
    q: 'Чи можна повернути квиток?',
    a: 'Так, повернення можливе не пізніше ніж за годину до початку сеансу. Гроші повертаються на картку, з якої була оплата.'
  },
  {
    q: 'Скільки діє бронь місць?',
    a: 'Після вибору місць вони бронюються на 10 хвилин. Якщо оплата не пройшла за цей час, місця знову стають доступними.'
  },
  {
    q: 'Це справжній сервіс?',
    a: 'Kvytok — навчальний open-source проєкт. Оплата демонстраційна: жодні реальні гроші не списуються.'
  }
]

export default function Support() {
  return (
    <>
      <Header />
      <main>
        <div className="shell support-page">
          <h1 className="page-title">Підтримка</h1>
          {FAQ.map(item => (
            <div key={item.q} className="faq-item">
              <span className="faq-q">{item.q}</span>
              <span className="faq-a">{item.a}</span>
            </div>
          ))}
          <div className="faq-item">
            <span className="faq-q">Не знайшли відповідь?</span>
            <span className="faq-a">Напишіть нам: support@kvytok.ua — відповідаємо протягом доби.</span>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
