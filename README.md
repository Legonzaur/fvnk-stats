# stats

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


Note to self (to implement later): 
average distance per attacker_name for players who have at least 500 K+D

```sql

SELECT AVG(distance) as 'distance', attacker_name, COUNT(map) as deathKillCount FROM data GROUP BY attacker_name HAVING `deathKillCount` > 500 ORDER BY `distance` DESC LIMIT 400;
```