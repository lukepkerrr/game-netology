`use strict`;
class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
  plus(childOfVector) {
    if (! (childOfVector instanceof Vector)) {
      throw new Error ('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector(this.x + childOfVector.x, this.y + childOfVector.y);
  }
  times(multiplier) {
    return new Vector(this.x * multiplier, this.y * multiplier);
  }
}
class Actor {
  constructor(position = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if ((position instanceof Vector) && (size instanceof Vector) && (speed instanceof Vector)) {
      this.pos = position;
      this.size = size;
      this.speed = speed;
    } else {
      throw new Error ('Ошибка в Actor');
    }
  }
  act() {
    
  }
  get left() {
    return this.pos.x;
  }
  get right() {
    return this.pos.x + this.size.x;
  }
  get top() {
    return this.pos.y;
  }
  get bottom() {
    return this.pos.y + this.size.y;
  }
  get type() {
    return 'actor';
  }
  isIntersect(movingObject){
    if (!(movingObject instanceof Actor)){
      throw new Error ('Ошибка в isIntersect');
    }
    if (movingObject === this){
      return false;
    }
    return this.top < movingObject.bottom && this.bottom > movingObject.top && this.right > movingObject.left && this.left < movingObject.right;
  }
}
class Level {
  constructor(grid = [], actors = []){
    this.grid = grid.slice();
    this.height = grid.length;
    this.width = Math.max( ...grid.map((el) => el.length), 0);
    this.actors = actors.slice();
    this.player = (this.actors.find((el) => el.type === 'player'));
    this.status = null;
    this.finishDelay = 1;
  }
  isFinished() {
    return this.status !== null  && this.finishDelay < 0;
  }
  actorAt(objectForCheck) {
    if (!(objectForCheck instanceof Actor)) {
      throw new Error ('Ошибка в actorAt');
	}
    return this.actors.find(el => el.isIntersect(objectForCheck));
  }
 obstacleAt(moveTo, size) {
    if ( !(moveTo instanceof Vector) || !(size instanceof Vector) ){
      throw new Error ('Ошибка в obstacleAt');
    }
    const newActor = new Actor(moveTo, size);
    if (newActor.bottom > this.height){
      return 'lava';
    }
    if ( (newActor.left < 0) || (newActor.right > this.width) || (newActor.top < 0) ){
      return 'wall';
    }
    const i = Math.floor(newActor.top);
    const iTo = Math.ceil(newActor.bottom);
    const j = Math.floor(newActor.left);
    const jTo = Math.ceil(newActor.right);
    for(let I = i; I < iTo; I++){
      for(let J = j; J < jTo; J++){
        if(this.grid[I][J]){
          const obstacle = this.grid[I][J];
          return obstacle;
        }
      }
    }
  }
  removeActor(objectForDelete){
    const forDelete = this.actors.findIndex((el) => (el === objectForDelete));
    if (forDelete !== -1)  {
      this.actors.splice(forDelete, 1);
    }
  }
  noMoreActors(typeOfActor) {
    return !( this.actors.some((el) => el.type === typeOfActor));
  }
  playerTouched(type, touchedObject) {
    if (type === `lava` || type === `fireball` && this.status === null) {
      this.status = `lost`;
    } else if (type === `coin` && this.status === null) {
      this.removeActor(touchedObject);
      if (this.noMoreActors(`coin`)) {
        this.status = `won`;
      }
    }
  }
}
class LevelParser {
  constructor (dictionary = {}) {
    this.dictionary = Object.assign({}, dictionary);
  }
  actorFromSymbol(symb) {
    if (symb && this.dictionary) {
      if (this.dictionary[symb]) {
        return this.dictionary[symb];
      } else {
        return undefined;
      }
    }
  }
  obstacleFromSymbol(symb) {
    if (symb === `x`) {
      return `wall`;
    }
    if (symb === `!`) {
      return `lava`;
    }
  }
  createGrid(arr = []) {
    return arr.map((row)=>{
      return row.split('').map((item)=>{
        return this.obstacleFromSymbol(item);
      });
    });
  }
  createActors(arr=[]) {
    if(!this.dictionary)
      return [];
    const actors = [];
    arr.forEach((row, i) => {
      row.split('').forEach((item, j) => {
        const Creator = this.actorFromSymbol(item);
        if(typeof Creator === 'function') {
          const createdAct = new Creator(new Vector(j, i));
          if (createdAct instanceof Actor){
            actors.push(createdAct);
          }
        }
      });
    });
    return actors;
  }
  parse(arr) {
    return new Level(this.createGrid(arr), this.createActors(arr));
  }
}
class Player extends Actor {
  constructor (position = new Vector(0, 0), size = new Vector(0.8, 1.5), speed = new Vector(0, 0)) {
    const changedPos = position.plus(new Vector(0, -0.5));
    super(changedPos, size);
    }
  get type() {
    return 'player';
  }
}
class Fireball extends Actor {
  constructor (position = new Vector(0, 0), speed = new Vector(0, 0)) {
    super(position, new Vector(1, 1), speed);
  }
  get type() {
    return 'fireball';
  }
  getNextPosition(time = 1) {
    return this.pos.plus(this.speed.times(time));
  }
  handleObstacle() {
    this.speed = this.speed.times(-1);
  }
  act(time, level) {
    const newPosition = this.getNextPosition(time);
    if (level.obstacleAt(newPosition, this.size)){
      this.handleObstacle();
    } else {
      this.pos = newPosition;
    }
  }
}
class HorizontalFireball extends Fireball {
  constructor (position = new Vector(0, 0)) {
    super(position, new Vector(2, 0));
  }
}
class VerticalFireball extends Fireball {
  constructor (position = new Vector(0, 0)) {
    super(position, new Vector(0, 2));
  }
}
class FireRain extends Fireball {
  constructor (position = new Vector(0, 0)) {
    super(position, new Vector(0, 3));
    this.start = position;
  }
  handleObstacle() {
    this.pos = this.start;
  }
}
class Coin extends Actor {
  constructor (position = new Vector(0, 0)) {
    super(position.plus(new Vector(0.2, 0.1)), new Vector(0.6, 0.6));
    this.posForSpring = position;
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
  }
  get type() {
    return 'coin';
  }
  updateSpring(time = 1) {
    this.spring = this.spring + (this.springSpeed * time);
  }
  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }
  getNextPosition(time = 1) {
    this.updateSpring(time);
    const spring = this.posForSpring.plus(this.getSpringVector());
    return spring.plus(new Vector(0.2, 0.1));
  }
  act(time) {
    this.pos = this.getNextPosition(time);
  }
}
const actorDict = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball
};
const parser = new LevelParser(actorDict);
loadLevels()
  .then((levels) => {
    try{
	  const scheme = JSON.parse(levels);
      runGame(scheme, parser, DOMDisplay)
	  	.then(() => console.log('Вы выиграли приз'));
    } catch (err){
      console.error(err);
    }
  });