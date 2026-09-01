@echo off
rem Donne a Git le mot de passe GitHub : le jeton OAuth de `gh`.
rem
rem Pourquoi : sur cette machine, Git Credential Manager
rem (credential.helper = manager-core) plante. `git credential fill` part en
rem segmentation fault et `git push` sort en 128 sans aucun message.
rem On desactive donc tous les helpers et Git demande login + mot de passe.
rem Le login est deja dans l'URL du remote (x-access-token@github.com), donc
rem ce script n'a qu'une seule question a traiter : le mot de passe.
rem Le jeton n'est jamais ecrit sur disque, il est lu a chaque appel.
rem Chemin complet vers gh.exe : cmd.exe herite d'un PATH minimal ici.
rem
rem Branche via :  git config core.askPass scripts/gh-askpass.bat
"C:\Program Files\GitHub CLI\gh.exe" auth token
