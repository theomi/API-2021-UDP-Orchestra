# Teaching-HEIGVD-API-2022-Labo-Orchestra

## Admin

* **You can work in groups of 2 students**.
* It is up to you if you want to fork this repo, or if you prefer to work in a private repo. However, you have to **use exactly the same directory structure for the validation procedure to work**.
* We expect that you will have more issues and questions than with other labs (because we have a left some questions open on purpose). Please ask your questions on Teams, so that everyone in the class can benefit from the discussion.
* ⚠️ You will have to send your GitHub URL, answer the questions and send the output log of the `validate.sh` script, which prove that your project is working [in this Google Form](https://forms.gle/6SM7cu4cYhNsRvqX8).

## Objectives

This lab has 4 objectives:

- The first objective is to **design and implement a simple application protocol on top of UDP**. It will be very similar to the protocol presented during the lecture (where thermometers were publishing temperature events in a multicast group and where a station was listening for these events).
  
- The second objective is to get familiar with several tools from **the JavaScript ecosystem**. You will implement two simple **Node.js** applications. You will also have to search for and use a couple of **npm modules** (i.e. third-party libraries).

- The third objective is to continue practicing with **Docker**. You will have to create 2 Docker images (they will be very similar to the images presented in class). You will then have to run multiple containers based on these images.

- Last but not least, the fourth objective is to **work with a bit less upfront guidance**, as compared with previous labs. This time, we do not provide a complete webcast to get you started, because we want you to search for information (this is a very important skill that we will increasingly train). Don't worry, we have prepared a fairly detailed list of tasks that will put you on the right track. If you feel a bit overwhelmed at the beginning, make sure to read this document carefully and to find answers to the questions asked in the tables. You will see that the whole thing will become more and more approachable.

## Requirements

In this lab, you will **write 2 small NodeJS applications** and **package them in Docker images**:

- the first app, **Musician**, simulates someone who plays an instrument in an orchestra. When the app is started, it is assigned an instrument (piano, flute, etc.). As long as it is running, every second it will emit a sound (well... simulate the emission of a sound: we are talking about a communication protocol). Of course, the sound depends on the instrument.

- the second app, **Auditor**, simulates someone who listens to the orchestra. This application has two responsibilities. Firstly, it must listen to Musicians and keep track of **active** musicians. A musician is active if it has played a sound during the last 5 seconds. Secondly, it must make this information available to you. Concretely, this means that it should implement a very simple TCP-based protocol.

![image](images/joke.jpg)

### Instruments and sounds

The following table gives you the mapping between instruments and sounds. Please **use exactly the same string values** in your code, so that validation procedures can work.

| Instrument | Sound       |
| ---------- | ----------- |
| `piano`    | `ti-ta-ti`  |
| `trumpet`  | `pouet`     |
| `flute`    | `trulu`     |
| `violin`   | `gzi-gzi`   |
| `drum`     | `boum-boum` |

### TCP-based protocol to be implemented by the Auditor application

- The auditor should include a TCP server and accept connection requests on port 2205.
- After accepting a connection request, the auditor must send a JSON payload containing the list of <u>active</u> musicians, with the following format (it can be a single line, without indentation):

```
[
  {
  	"uuid" : "aa7d8cb3-a15f-4f06-a0eb-b8feb6244a60",
  	"instrument" : "piano",
  	"activeSince" : "2016-04-27T05:20:50.731Z"
  },
  {
  	"uuid" : "06dbcbeb-c4c8-49ed-ac2a-cd8716cbf2d3",
  	"instrument" : "flute",
  	"activeSince" : "2016-04-27T05:39:03.211Z"
  }
]
```

### What you should be able to do at the end of the lab

You should be able to start an **Auditor** container with the following command:

```
$ docker run -d -p 2205:2205 res/auditor
```

You should be able to connect to your **Auditor** container over TCP and see that there is no active musician.

```
$ telnet IP_ADDRESS_THAT_DEPENDS_ON_YOUR_SETUP 2205
[]
```

You should then be able to start a first **Musician** container with the following command:

```
$ docker run -d res/musician piano
```

After this, you should be able to verify two points. Firstly, if you connect to the TCP interface of your **Auditor** container, you should see that there is now one active musician (you should receive a JSON array with a single element). Secondly, you should be able to use `tcpdump` to monitor the UDP datagrams generated by the **Musician** container.

You should then be able to kill the **Musician** container, wait 5 seconds and connect to the TCP interface of the **Auditor** container. You should see that there is now no active musician (empty array).

You should then be able to start several **Musician** containers with the following commands:

```
$ docker run -d res/musician piano
$ docker run -d res/musician flute
$ docker run -d res/musician flute
$ docker run -d res/musician drum
```

When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.

# Tasks and questions

When you connect to the TCP interface of the **Auditor**, you should receive an array of musicians that corresponds to your commands. You should also use `tcpdump` to monitor the UDP trafic in your system.

## Task 1: design the application architecture and protocols

| #        | Topic                                                                                                                                                                                                                                                                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Question | How can we represent the system in an **architecture diagram**, which gives information both about the Docker containers, the communication protocols and the commands?                                                                                                                                                                            |
|          | ![image](images/diagram.svg)                                                                                                                                                                                                                                                                                                                       |
| Question | Who is going to **send UDP datagrams** and **when**?                                                                                                                                                                                                                                                                                               |
|          | Les musiciens envoient des paquets UDP en multicast toutes les secondes lorsqu'ils jouent de leur instrument.                                                                                                                                                                                                                                      |
| Question | Who is going to **listen for UDP datagrams** and what should happen when a datagram is received?                                                                                                                                                                                                                                                   |
|          | L'auditer va écouter le trafic UDP et recevoir les paquets multicast envoyés par les musiciens. Lorsqu'il les reçoit, il les affiche sur sa sortie.                                                                                                                                                                                                |
| Question | What **payload** should we put in the UDP datagrams?                                                                                                                                                                                                                                                                                               |
|          | Les paquets contiennent un objet JSON avec différentes propriétés. Dans le cas des musiciens, leur ID unique et le son produit par leur instrument.                                                                                                                                                                                                |
| Question | What **data structures** do we need in the UDP sender and receiver? When will we update these data structures? When will we query these data structures?                                                                                                                                                                                           |
|          | Les musiciens contiennent une table de hachage contenant tous les instruments ainsi que leur son. Les auditeurs contiennent cette même table de hachage, ainsi qu'une deuxième qui contient la liste des musiciens ayant été entendus, donc leur UUID, leur horodatage de première activité et l'instrument joué (déterminé par traduction du son) |

## Task 2: implement a "musician" Node.js application

| #        | Topic                                                                                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Question | In a JavaScript program, if we have an object, how can we **serialize it in JSON**?                                                                                                                                                                                |
|          | Avec l'instruction `JSON.stringify()`                                                                                                                                                                                                                              |
| Question | What is **npm**?                                                                                                                                                                                                                                                   |
|          | NPM (Node package manager) est un gestionnaire de paquets utilisé pour l'environnement `NodeJS`                                                                                                                                                                    |
| Question | What is the `npm install` command and what is the purpose of the `--save` flag?                                                                                                                                                                                    |
|          | La commande `npm install` permet d'installer une dépendance spécifique ou toutes les dépendances présentes dans le fichier `package.json`. Le flag `--save` est aujourd'hui utilisé par défaut et il permet d'ajouter la dépendance dans le fichier `package.json` |
| Question | How can we use the `https://www.npmjs.com/` web site?                                                                                                                                                                                                              |
|          | Le site web `npmjs.com` est une gallerie permetant de faire des recherches de paquets publiés par la communauté. Lorsque l'on cherche un paquet, on obtient alors la commande `npm install <nom paquet>` permettant de l'installer                                 |
| Question | In JavaScript, how can we **generate a UUID** compliant with RFC4122?                                                                                                                                                                                              |
|          | En utilisant le package [uuid](https://www.npmjs.com/package/uuid) disponible sur le site `npmjs`                                                                                                                                                                  |
| Question | In Node.js, how can we execute a function on a **periodic** basis?                                                                                                                                                                                                 |
|          | En utilisant la fonction `setInterval()`                                                                                                                                                                                                                           |
| Question | In Node.js, how can we **emit UDP datagrams**?                                                                                                                                                                                                                     |
|          | En utilisant la librairie `dgram` qui est un module implémentant les sockets UDP                                                                                                                                                                                   |
| Question | In Node.js, how can we **access the command line arguments**?                                                                                                                                                                                                      |
|          | En utilisant la propriété `process.argv` qui retourne un tableau contenant les arguments passés par la ligne de commande                                                                                                                                           |

## Task 3: package the "musician" app in a Docker image

| #        | Topic                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Question | How do we **define and build our own Docker image**?                                                                                                                                                                                                                                                                                                                                                                                                     |
|          | On définit notre propre image en utilisant un `Dockerfile` ou un fichier `docker-compose.yml`. Ces fichiers contiennent la "recette de cuisine" permettant de construire l'image à partir d'une image déjà existante, provenant par exemple du _Docker Hub_. Pour la construction, on utilise soit la commande `docker build -t <nom> .` dans le cas d'un `Dockerfile`, soit `docker-compose up` pour construire et démarrer une _stack_ Docker Compose. |
| Question | How can we use the `ENTRYPOINT` statement in our Dockerfile?                                                                                                                                                                                                                                                                                                                                                                                             |
|          | La déclaration `ENTRYPOINT` permet de spécifier un exécutable et d'éventuels arguments de ligne de commande qui sera exécuté au lancement du container. Cela permet en fait d'utiliser un container comme s'il était l'exécutable lui-même.                                                                                                                                                                                                              |
| Question | After building our Docker image, how do we use it to **run containers**?                                                                                                                                                                                                                                                                                                                                                                                 |
|          | Lorsque notre image est construite, il est possible de lancer des containers basés dessus via la commande `docker run [options] <image>`. Par exemple, pour une image nommée `api/musician`, la commande de démarrage sera `docker -d run api/ musician` (où `-d` signifie que le container est démarré en arrière-plan)                                                                                                                                 |
| Question | How do we get the list of all **running containers**?                                                                                                                                                                                                                                                                                                                                                                                                    |
|          | Avec la commande `docker ps`.                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Question | How do we **stop/kill** one running container?                                                                                                                                                                                                                                                                                                                                                                                                           |
|          | Avec la commande `docker stop <container>`(renseigner l'UUID du container ou son nom)                 , on arrête "proprement" le container. La commande `docker kill <container>` permet de forcer l'arrêt (va terminer abruptement le container)                                                                                                                                                                                                       |
| Question | How can we check that our running containers are effectively sending UDP datagrams?                                                                                                                                                                                                                                                                                                                                                                      |
|          | Il est possible de *logger* dans la console lorsqu'un container reçoit un datagramme UDP. Pour ce faire, on utilise l'événement "message", et on effectue un `console.log` de son contenu. |


## Task 4: implement an "auditor" Node.js application

| #        | Topic                                                                                              |
| -------- | -------------------------------------------------------------------------------------------------- |
| Question | With Node.js, how can we listen for UDP datagrams in a multicast group?                            |
|          | Il faut commencer par importer le module `dgram` qui fournit une implémentation des sockets liés aux datagrammes UDP. On peut ensuite créer un nouveau socket UDP, puis le relier à un port choisi. On va ensuite rajouter le socket dans un groupe multicast, identifié par une adresse multicast. Cela permet au système de savoir sur quelle interface réseau communiquer. On peut ensuite utiliser l'evénement `message` pour spécifier les actions à effectuer lorsqu'un datagramme est reçu. |
| Question | How can we use the `Map` built-in object introduced in ECMAScript 6 to implement a **dictionary**? |
|          | Une `map` est une structure de données permettant de stocker des informations sous forme de paire clé-valeur. De plus, une `map` a la particularité de ne stocker qu'un seul exemplaire de chaque clé. Cela signifie que si une valeur portant une clé déjà existante est insérée, elle va remplacer la valeur existante. Dans notre cas, nous allons créer une `Map` qui stocke tous les messages reçus en utilisant l'UUID de l'émetteur comme clé, afin de ne garder que le dernier message reçu. La fonction `set()` permet d'attribuer une valeur à une clé donnée. |
| Question | How can we use the `Moment.js` npm module to help us with **date manipulations** and formatting?   |
|          | Pour ce labo, nous n'avons pas eu besoin de ce module car nous avons utilisé directement l'objet `Date` qui est natif à JavaScript. Plus précisément la fonction `Date.now()` qui permet d'obtenir la date courante. Cependant, l'utilisation de `Moment.js` pourrait être intéressante pour formatter les dates autrement. |
| Question | When and how do we **get rid of inactive players**?                                                |
|          | Dans notre cas, nous avons décidé de supprimer les joueurs inactifs de la liste lorsqu'une connexion est effectuée sur le serveur TCP. Au moment où une connexion est ouverte, nous effectuons une conversion de la `Map` en tableau, puis nous supprimons toutes les entrées dont la date de première activité est supérieure au délai de *timeout* spécifié par le protocole.|
| Question | How do I implement a **simple TCP server** in Node.js?                                             |
|          | À l'aide du module `net`. Il faut tout d'abord créer un serveur puis le faire écouter sur le port souhaité. On peut ensuite utiliser l'évènement "connection" pour effectuer des actions au moment où une connexion cliente est effectuée. Il faut ensuite terminer la connexion pour pouvoir libérer le *socket* pour un autre client. |

## Task 5: package the "auditor" app in a Docker image

| #        | Topic                                                                                |
| -------- | ------------------------------------------------------------------------------------ |
| Question | How do we validate that the whole system works, once we have built our Docker image? |
|          | En utilisant le script `validate.sh` fourni, qui va démarrer une instance de l'image "validation" également fournie. Cette image va lancer les images `musician` et `auditor` et vérifier que tout fonctionne. |

## Constraints

Please be careful to adhere to the specifications in this document, and in particular

- the Docker image names
- the names of instruments and their sounds
- the TCP PORT number

Also, we have prepared two directories, where you should place your two `Dockerfile` with their dependent files.

### Validation

Have a look at the `validate.sh` script located in the top-level directory. This script automates part of the validation process for your implementation (it will gradually be expanded with additional operations and assertions). As soon as you start creating your Docker images (i.e. creating your Dockerfiles), you should **try to run it** to see if your implementation is correct. When you submit your project in the [Google Form](https://forms.gle/6SM7cu4cYhNsRvqX8), the script will be used for grading, together with other criteria.