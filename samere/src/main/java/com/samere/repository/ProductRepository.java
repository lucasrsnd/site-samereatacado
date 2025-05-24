package com.samere.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import com.samere.model.Product;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByBrandContainingIgnoreCase(String brand);
}
