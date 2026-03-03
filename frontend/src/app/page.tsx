'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion'; 

export default function HomePage() {
  const router = useRouter();
  const { user, login, register, logout, isLoading: isAuthLoading } = useAuth();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openModal = (type: 'login' | 'register') => {
    setError('');
    setUsername('');
    setPassword('');
    setFormType(type);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');
    try {
      if (formType === 'login') {
        await login(username, password);
        router.push('/dashboard');
      } else {
        await register(username, password);
        setIsModalOpen(false);
        alert('Регистрация прошла успешно! Теперь вы можете войти.');
        openModal('login');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка. Проверьте правильность логина и пароля.');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-8 py-4 flex justify-between items-center border-b bg-card">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/image.png"
            alt="GoAnalytics Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
          <h1 className="text-2xl font-bold cursor-pointer transition-colors">
            GoAnalytics
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthLoading ? (
            <div className="h-10 w-48 bg-muted rounded animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <span className="font-medium">
                Добро пожаловать, {user.username}!
              </span>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Панель управления
              </Button>
              <Button onClick={handleLogout}>Выход</Button>
            </div>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => openModal('login')}>
                Вход
              </Button>
              <Button onClick={() => openModal('register')}>
                Регистрация
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-8">
        {/* 2. Анимация для заголовка */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-extrabold mb-4"
        >
          Управляйте вашим автопарком эффективно
        </motion.h2>
        
        {/* 3. Анимация для подзаголовка с задержкой */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-lg text-muted-foreground mb-8"
        >
          «GoAnalytics» — это аналитическое приложение для автоматизации учета
          использования основных средств вашей автотранспортной компании.
          Принимайте решения на основе данных.
        </motion.p>

        {/* 4. Анимация для контейнера с карточками */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full"
        >
          {/* 5. Анимация при наведении на каждую карточку */}
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <div className="p-6 bg-card rounded-lg border h-full">
              <h3 className="text-xl font-semibold mb-2">Аналитика в реальном времени</h3>
              <p className="text-muted-foreground">Получайте актуальные данные о пробеге, расходе топлива и затратах без задержек.</p>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <div className="p-6 bg-card rounded-lg border h-full">
              <h3 className="text-xl font-semibold mb-2">Оптимизация затрат</h3>
              <p className="text-muted-foreground">Выявляйте самые затратные транспортные средства и оптимизируйте их использование.</p>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <div className="p-6 bg-card rounded-lg border h-full">
              <h3 className="text-xl font-semibold mb-2">Экспорт отчетов</h3>
              <p className="text-muted-foreground">Формируйте и выгружайте детализированные отчеты в формате PDF для руководства.</p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {formType === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
            </DialogTitle>
            <DialogDescription>
              {formType === 'login'
                ? 'Введите ваши данные для входа.'
                : 'Заполните форму для регистрации.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Логин
                </Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3" disabled={isFormLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Пароль
                </Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" disabled={isFormLoading} />
              </div>
            </div>

            {error && (
              <p className="text-center text-sm text-red-600 pt-2">{error}</p>
            )}

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isFormLoading}>
                {isFormLoading ? 'Загрузка...' : (formType === 'login' ? 'Войти' : 'Зарегистрироваться')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
