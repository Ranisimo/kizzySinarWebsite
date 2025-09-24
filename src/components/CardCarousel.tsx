import React, { useEffect, useRef } from "react";
import Card from "react-bootstrap/Card";

// Small dragging utility adapted from the CodePen
class DraggingEvent {
  target: HTMLElement | null;
  constructor(target: HTMLElement | null = null) {
    this.target = target;
  }

  event(callback: (e: any) => any) {
    if (!this.target) return;

    let handler: any;

    const clearDraggingEvent = () => {
      if (handler) window.removeEventListener("mousemove", handler);
      window.removeEventListener("mouseup", clearDraggingEvent);
      document.removeEventListener("mouseleave", clearDraggingEvent);
      handler && handler(null);
    };

    this.target.addEventListener("mousedown", (e: MouseEvent) => {
      e.preventDefault();
      handler = callback(e);
      window.addEventListener("mousemove", handler);
      document.addEventListener("mouseleave", clearDraggingEvent);
      window.addEventListener("mouseup", clearDraggingEvent);
    });

    this.target.addEventListener("touchstart", (e: TouchEvent) => {
      handler = callback(e);
      window.addEventListener("touchmove", handler as any);
      window.addEventListener("touchend", () => {
        window.removeEventListener("touchmove", handler as any);
        handler(null);
      });
    });
  }

  getDistance(callback: (d: any) => void) {
    const distanceInit = (e1: any) => {
      let startingX: number;
      if ("touches" in e1) {
        startingX = e1.touches[0].clientX;
      } else {
        startingX = e1.clientX;
      }

      return function (e2: any) {
        if (e2 === null) {
          return callback(null);
        } else {
          if ("touches" in e2) {
            return callback({ x: e2.touches[0].clientX - startingX });
          } else {
            return callback({ x: e2.clientX - startingX });
          }
        }
      };
    };

    this.event(distanceInit);
  }
}

// Carousel logic ported and adapted
class Carousel extends DraggingEvent {
  container: HTMLElement;
  controllerElement?: HTMLElement | null;
  controllerHandler?: (e: KeyboardEvent) => void;
  cards: HTMLElement[];
  centerIndex: number;
  cardWidth: number;
  xScale: Record<number, HTMLElement>;
  resizeHandler: () => void;

  constructor(container: HTMLElement, controller: HTMLElement | null = null) {
    super(container);
    this.container = container;
    this.controllerElement = controller;
    this.cards = Array.from(container.querySelectorAll(".card")) as HTMLElement[];
    this.centerIndex = (this.cards.length - 1) / 2;
    this.cardWidth = this.cards[0]?.offsetWidth / this.container.offsetWidth * 100 || 0;
    this.xScale = {};

    this.resizeHandler = this.updateCardWidth.bind(this);
    window.addEventListener("resize", this.resizeHandler);

    if (this.controllerElement) {
      this.controllerHandler = this.controller.bind(this);
      this.controllerElement.addEventListener("keydown", this.controllerHandler);
    }

    this.build();
    super.getDistance(this.moveCards.bind(this));
  }

  destroy() {
    window.removeEventListener("resize", this.resizeHandler);
    if (this.controllerElement && this.controllerHandler) {
      this.controllerElement.removeEventListener("keydown", this.controllerHandler);
    }
  }

  updateCardWidth() {
  if (!this.cards.length) return;
  this.cardWidth = this.cards[0].offsetWidth / this.container.offsetWidth * 100;
    this.build();
  }

  build() {
    for (let i = 0; i < this.cards.length; i++) {
      const x = i - this.centerIndex;
      const scale = this.calcScale(x);
      const scale2 = this.calcScale2(x);
      const zIndex = -(Math.abs(i - this.centerIndex));
      const leftPos = this.calcPos(x, scale2);
      this.xScale[x] = this.cards[i];
      this.updateCards(this.cards[i], { x, scale, leftPos, zIndex });
    }
  }

  controller(e: KeyboardEvent) {
    const temp: Record<number, HTMLElement> = {};
    if (e.key === "ArrowRight") {
      for (let x in this.xScale) {
        const xi = parseInt(x, 10);
        const newX = (xi - 1 < -this.centerIndex) ? this.centerIndex : xi - 1;
        temp[newX] = this.xScale[xi];
      }
    }
    if (e.key === "ArrowLeft") {
      for (let x in this.xScale) {
        const xi = parseInt(x, 10);
        const newX = (xi + 1 > this.centerIndex) ? -this.centerIndex : xi + 1;
        temp[newX] = this.xScale[xi];
      }
    }

    this.xScale = temp;
    for (let x in temp) {
      const xi = parseInt(x, 10);
      const scale = this.calcScale(xi);
      const scale2 = this.calcScale2(xi);
      const leftPos = this.calcPos(xi, scale2);
      const zIndex = -Math.abs(xi);
      this.updateCards(this.xScale[xi], { x: xi, scale, leftPos, zIndex });
    }
  }

  calcPos(x: number, scale: number) {
    let formula: number;
    if (x < 0) {
      formula = (scale * 100 - this.cardWidth) / 2;
      return formula;
    } else {
      formula = 100 - (scale * 100 + this.cardWidth) / 2;
      return formula;
    }
  }

  updateCards(card: HTMLElement, data: any) {
    if (data.x || data.x === 0) card.setAttribute("data-x", String(data.x));
    if (data.scale || data.scale === 0) {
      card.style.transform = `scale(${data.scale})`;
      card.style.opacity = data.scale === 0 ? "0" : "1";
    }
    if (data.leftPos || data.leftPos === 0) card.style.left = `${data.leftPos}%`;
    if (data.zIndex || data.zIndex === 0) {
      if (data.zIndex === 0) card.classList.add("highlight");
      else card.classList.remove("highlight");
      card.style.zIndex = String(data.zIndex);
    }
  }

  calcScale2(x: number) {
    if (x <= 0) return 1 - -1 / 5 * x;
    return 1 - 1 / 5 * x;
  }

  calcScale(x: number) {
    const formula = 1 - 1 / 5 * Math.pow(x, 2);
    return formula <= 0 ? 0 : formula;
  }

  checkOrdering(card: HTMLElement, x: number, xDist: number) {
    const original = parseInt(card.dataset.x || "0", 10);
    const rounded = Math.round(xDist);
    let newX = x;
    if (x !== x + rounded) {
      if (x + rounded > original) {
        if (x + rounded > this.centerIndex) {
          newX = ((x + rounded - 1) - this.centerIndex) - rounded + -this.centerIndex;
        }
      } else if (x + rounded < original) {
        if (x + rounded < -this.centerIndex) {
          newX = ((x + rounded + 1) + this.centerIndex) - rounded + this.centerIndex;
        }
      }
      this.xScale[newX + rounded] = card;
    }
    const temp = -Math.abs(newX + rounded);
    this.updateCards(card, { zIndex: temp });
    return newX;
  }

  moveCards(data: any) {
    let xDist: number;
    if (data != null) {
      this.container.classList.remove("smooth-return");
      xDist = data.x / 250;
    } else {
      this.container.classList.add("smooth-return");
      xDist = 0;
      for (let x in this.xScale) {
        this.updateCards(this.xScale[x], { x: Number(x), zIndex: Math.abs(Math.abs(Number(x)) - this.centerIndex) });
      }
    }

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const x = this.checkOrdering(card, parseInt(card.dataset.x || "0", 10), xDist);
      const scale = this.calcScale(x + xDist);
      const scale2 = this.calcScale2(x + xDist);
      const leftPos = this.calcPos(x + xDist, scale2);
      this.updateCards(card, { scale, leftPos });
    }
  }
}

const CardCarousel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const carouselRef = useRef<Carousel | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    // Instantiate carousel once in browser
    carouselRef.current = new Carousel(container, null);

    return () => {
      // cleanup
      carouselRef.current?.destroy();
      carouselRef.current = null;
    };
  }, []);

  return (
    <div className="container-carousel" ref={containerRef}>
      <div className="card-carousel">
        <Card className="card" id="1">
          <Card.Img src="environemntalismcard.jpeg" alt="Nature Scene" />
          <Card.Header className="bg-yellow card-custom">Projects</Card.Header>
          <Card.Body>
            <Card.Title>FISC Study Tool</Card.Title>
            <Card.Text>
              One of my proudest contributions is my FISC Study Tool. It has always been my dream to work in the environmental or ecological sector, and one of the first skills employers look for it a FISC certification. Being able to identify native plants while conducting a survey is vital, as an ecological consultant's credibility often hinges on their ability to accurately identify flora in the field. The FISC Study Tool is designed to help aspiring consultants prepare for the FISC exam by providing a comprehensive database of plant species, along with interactive quizzes and study materials. By making this tool freely available, I hope to support others in achieving their certification and advancing their careers in environmental consultancy.
            </Card.Text>
          </Card.Body>
        </Card>
        <Card className="card" id="2">
          <Card.Img src="animalcard.jpeg" alt="Chipmunk" />
          <Card.Header className="bg-yellow card-custom">Ethos</Card.Header>
          <Card.Body>
            <Card.Title>Environmentalist</Card.Title>
            <Card.Text>
              I am an environmentalist at heart who believes in the power of technology to drive positive change. However, most of that change depends on the people driving it. My goal is to use my skills to create applications that empower individuals and communities to make informed decisions and take meaningful action towards a more sustainable future. I refrain from using AI due to its impact on the environment and potential job losses it may cause. Instead, I focus on leveraging my expertise in web development to build tools that facilitate environmental conservation and awareness. By combining my passion for the environment with my technical skills, I aim to contribute to a more sustainable world.
            </Card.Text>
          </Card.Body>
        </Card>
        <Card className="card" id="3">
          <Card.Img src="treecard.jpeg" alt="Tree with Bird" />
          <Card.Header className="bg-yellow card-custom">Sources</Card.Header>
          <Card.Body>
            <Card.Title>Contributions</Card.Title>
            <Card.Text>
              This tool wouldn't have been possible without the BISC Online Plant Atlas 2020, which provided the essential data needed to build the database. I am deeply grateful to the BSBI for making this information accessible to the public, as it has enabled me to create a resource that can benefit many aspiring ecological consultants. By leveraging this data, I have been able to develop a tool that not only aids in exam preparation but also promotes greater awareness and appreciation of plant biodiversity.
            </Card.Text>
          </Card.Body>
        </Card>
        <a href="#" className="visuallyhidden card-controller">
          Carousel controller
        </a>
      </div>
    </div>
  );
};

export default CardCarousel;
