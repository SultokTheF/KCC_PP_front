import { Link } from "react-router-dom";
import { Button } from "@material-tailwind/react";

export default function PageNotFound() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-blue-600">404</h1>
        <p className="text-2xl font-medium text-gray-800 mb-8">
          Страница не найдена
        </p>
        <p className="text-lg text-gray-600 mb-4">
          Извините, но страница, которую вы ищете, не существует.
        </p>
        <Link to="/">
          <Button className="mt-4">Вернуться на главную</Button>
        </Link>
      </div>
    </div>
  );
}
