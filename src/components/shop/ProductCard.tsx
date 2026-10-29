import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatPrice, type Product } from "@/src/config/commerce";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <Link
      className="product-card"
      href={`/shop/${product.slug}`}
      aria-label={`View ${product.name}, ${formatPrice(product.price)} USD, pre-order`}
    >
      <div className="product-image">
        <span className="product-badge">AVAILABLE FOR PRE-ORDER</span>
        <Image
          className="product-front"
          src={product.front}
          alt={`${product.color} Evoke jersey, front`}
          width={1254}
          height={1254}
          sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 620px"
          priority={priority}
        />
        <Image
          className="product-back"
          src={product.back}
          alt={`${product.color} Evoke jersey, back`}
          width={1254}
          height={1254}
          sizes="(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 620px"
        />
        <span className="product-view">
          View jersey <ArrowUpRight size={17} aria-hidden="true" />
        </span>
      </div>
      <div className="product-card-meta">
        <div>
          <h3>Evoke official jersey</h3>
          <p>
            <span className={`color-dot ${product.id}`} aria-hidden="true" />{" "}
            {product.color}
          </p>
        </div>
        <span className="price">
          {formatPrice(product.price)} <small>USD</small>
        </span>
      </div>
    </Link>
  );
}

export default ProductCard;
