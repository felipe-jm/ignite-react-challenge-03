import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const updatedLocalStorage = (updatedCart: Product[]) => {
    localStorage.setItem("@RocketShoes:cart", JSON.stringify(updatedCart));
  };

  const addProduct = async (productId: number) => {
    try {
      const { data: stock } = await api.get<Stock>(`stock/${productId}`);

      const productInCart = cart.find((prod) => prod.id === productId);

      if (productInCart) {
        if (stock.amount === 0) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        updateProductAmount({ productId, amount: productInCart.amount + 1 });
      } else {
        const { data: product } = await api.get<Product>(
          `products/${productId}`
        );

        if (stock.amount === 0) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        product.amount = 1;

        const updatedCart = [...cart, product];

        setCart(updatedCart);

        updatedLocalStorage(updatedCart);
      }
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const product = cart.find((product) => product.id === productId);

      if (!product) {
        toast.error("Erro na remoção do produto");
        return;
      }

      const updatedCart = cart.filter((product) => product.id !== productId);

      setCart(updatedCart);

      updatedLocalStorage(updatedCart);
    } catch {
      toast.error("Erro ao tentar adicionar remover produto do carrinho!");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: stock } = await api.get<Stock>(`stock/${productId}`);

      if (stock.amount === 0) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (amount < 1) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      if (amount > stock.amount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      const updatedCart = cart.map((product) =>
        product.id === productId ? { ...product, amount } : product
      );

      setCart(updatedCart);

      updatedLocalStorage(updatedCart);
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
