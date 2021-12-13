import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import Link from 'next/link'
import LandingPage from '../components/homepage/LandingPage.js'
import { Layout, Menu, Breadcrumb } from 'antd';

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation, initReactI18next } from "react-i18next";

const { Header, Content, Footer } = Layout;

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['home'])),
    }
  }
}

export default function Home() {
  const { t } = useTranslation();
  return (
    <div>
      <Head>
        <title>{t('home:Salazar')}</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <LandingPage />
      <footer className={styles.footer}>
        FOOTER
      </footer>
    </div >
  )
}
