# Guide de Configuration Rapide

## Étapes de configuration

### 1. Créer un compte Clerk

1. Allez sur [https://clerk.com](https://clerk.com)
2. Créez un compte gratuit
3. Créez une nouvelle application "Football 5c5"
4. Dans **Configure → Paths**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - Home URL: `/groups`
5. Copiez votre **Publishable Key** (commence par `pk_test_...`)

### 2. Créer un projet Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte gratuit
3. Créez un nouveau projet "football-5c5"
4. Notez votre mot de passe de base de données (vous en aurez besoin)
5. Attendez que le projet soit créé (2-3 minutes)

### 3. Configurer la base de données Supabase

1. Dans votre projet Supabase, allez dans **SQL Editor**
2. Cliquez sur **New Query**
3. Ouvrez le fichier `supabase-schema.sql` de ce projet
4. Copiez tout le contenu et collez-le dans l'éditeur SQL
5. Cliquez sur **Run** pour exécuter le script
6. Vérifiez que toutes les tables sont créées dans **Table Editor**

### 4. Récupérer les clés Supabase

1. Allez dans **Settings → API**
2. Copiez:
   - **Project URL** (commence par `https://...supabase.co`)
   - **anon/public key** (commence par `eyJ...`)

### 5. Configurer Clerk + Supabase JWT

1. Dans **Supabase**, allez dans **Settings → API**
2. Scrollez jusqu'à **JWT Settings**
3. Copiez le **JWT Secret** (commençant par `...`)

4. Dans **Clerk Dashboard**, allez dans **JWT Templates**
5. Cliquez sur **New Template**
6. Sélectionnez **Supabase** dans la liste
7. Nommez-le "supabase"
8. Collez le JWT Secret de Supabase
9. Cliquez sur **Save**

### 6. Créer le fichier .env

Créez un fichier `.env` à la racine du projet avec:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_CLERK
VITE_SUPABASE_URL=https://VOTRE_PROJET.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...VOTRE_CLE_ANON
```

Remplacez les valeurs par vos vraies clés.

### 7. Installer et lancer

```bash
npm install
npm run dev
```

L'application devrait s'ouvrir sur `http://localhost:5173`

## Vérification

### Test 1: Inscription
1. Cliquez sur "Sign up"
2. Créez un compte avec votre email
3. Vous devriez être redirigé vers `/groups`

### Test 2: Base de données
1. Allez dans Supabase → **Table Editor** → **users**
2. Vous devriez voir votre utilisateur créé avec votre `clerk_id`

### Test 3: Créer un groupe
1. Cliquez sur le bouton "+" en bas à droite
2. Créez un groupe public "Test"
3. Vous devriez voir le groupe dans la liste

### Test 4: Créer un five
1. Cliquez sur votre groupe
2. Cliquez sur "+" pour créer un five
3. Remplissez le formulaire
4. Le five devrait apparaître dans la liste

## Problèmes courants

### Erreur "Missing Clerk Publishable Key"
- Vérifiez que votre fichier `.env` existe
- Vérifiez que la clé commence par `VITE_`
- Redémarrez le serveur de développement

### Erreur de connexion Supabase
- Vérifiez que votre URL Supabase est correcte
- Vérifiez que votre clé anon est complète
- Vérifiez que le schéma SQL a bien été exécuté

### Les utilisateurs ne sont pas créés dans Supabase
- Vérifiez la configuration JWT entre Clerk et Supabase
- Vérifiez les policies RLS dans Supabase
- Regardez la console du navigateur pour les erreurs

### Impossible de créer un groupe/five
- Vérifiez que vous êtes bien connecté
- Vérifiez que les policies RLS sont activées
- Vérifiez les logs dans la console

## Support

Si vous rencontrez des problèmes:
1. Vérifiez la console du navigateur (F12)
2. Vérifiez les logs Supabase dans **Logs → Postgres Logs**
3. Vérifiez les logs Clerk dans **Logs**

## Prochaines étapes

Une fois l'application fonctionnelle:
- [ ] Invitez des amis à tester
- [ ] Créez plusieurs groupes
- [ ] Organisez votre premier five
- [ ] Testez les groupes privés avec code d'invitation
- [ ] Explorez les améliorations possibles (voir README.md)
