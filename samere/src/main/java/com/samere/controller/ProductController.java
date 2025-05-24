package com.samere.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.samere.model.Product;
import com.samere.service.ProductService;

import java.io.IOException;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    @Autowired
    private ProductService service;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @GetMapping
    public ResponseEntity<List<Product>> getAll(@RequestParam(value = "brand", required = false) String brand) {
        List<Product> products;
        if (brand == null || brand.isBlank()) {
            products = service.findAll();
        } else {
            products = service.findByBrandContainingIgnoreCase(brand);
        }
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getById(@PathVariable Long id) {
        Optional<Product> product = service.findById(id);
        return product.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<Product> createProduct(
            @RequestParam("brand") String brand,
            @RequestParam("fabric") String fabric,
            @RequestParam("colors") List<String> colors,
            @RequestParam("sizes") List<String> sizes,
            @RequestParam("images") MultipartFile[] images,
            @RequestParam(value = "outOfStock", defaultValue = "false") boolean outOfStock
    ) throws IOException {
        Product product = new Product();
        product.setBrand(brand);
        product.setFabric(fabric);
        product.setColors(colors);
        product.setSizes(sizes);
        product.setOutOfStock(outOfStock);

        List<String> imagePaths = new ArrayList<>();
        Path uploadPath = Paths.get(uploadDir);

        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        for (int i = 0; i < Math.min(images.length, 3); i++) {
            MultipartFile image = images[i];
            if (image != null && !image.isEmpty()) {
                String filename = StringUtils.cleanPath(image.getOriginalFilename());
                String filePath = uploadDir + "/" + System.currentTimeMillis() + "_" + i + "_" + filename;
                Path fileStorage = Paths.get(filePath);
                Files.copy(image.getInputStream(), fileStorage, StandardCopyOption.REPLACE_EXISTING);
                imagePaths.add(filePath);
            }
        }

        product.setImagePaths(imagePaths);
        Product saved = service.save(product);
        return ResponseEntity.ok(saved);
    }

    @PutMapping(value = "/{id}", consumes = {"multipart/form-data"})
public ResponseEntity<Product> updateProduct(
        @PathVariable Long id,
        @RequestParam("brand") String brand,
        @RequestParam("fabric") String fabric,
        @RequestParam("colors") List<String> colors,
        @RequestParam("sizes") List<String> sizes,
        @RequestParam(value = "images", required = false) MultipartFile[] images,
        @RequestParam(value = "removedImages", required = false) List<String> removedImages,
        @RequestParam(value = "outOfStock", defaultValue = "false") boolean outOfStock
) throws IOException {
    Optional<Product> optionalProduct = service.findById(id);
    if (optionalProduct.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

    Product product = optionalProduct.get();
    product.setBrand(brand);
    product.setFabric(fabric);
    product.setColors(colors);
    product.setSizes(sizes);
    product.setOutOfStock(outOfStock);

    List<String> currentImages = product.getImagePaths() != null ? 
            new ArrayList<>(product.getImagePaths()) : new ArrayList<>();

    if (removedImages != null && !removedImages.isEmpty()) {
        for (String imgPath : removedImages) {
            try {
                Files.deleteIfExists(Paths.get(imgPath));
                currentImages.remove(imgPath);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    if (images != null && images.length > 0) {
        Path uploadPath = Paths.get(uploadDir);
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
        }

        int availableSlots = Math.max(0, 3 - currentImages.size());
        int imagesToAdd = Math.min(images.length, availableSlots);

        for (int i = 0; i < imagesToAdd; i++) {
            MultipartFile image = images[i];
            if (image != null && !image.isEmpty()) {
                String filename = StringUtils.cleanPath(image.getOriginalFilename());
                String filePath = uploadDir + "/" + System.currentTimeMillis() + "_" + i + "_" + filename;
                Path fileStorage = Paths.get(filePath);
                Files.copy(image.getInputStream(), fileStorage, StandardCopyOption.REPLACE_EXISTING);
                currentImages.add(filePath);
            }
        }
    }

    if (currentImages.size() > 3) {
        currentImages = currentImages.subList(0, 3);
    }

    product.setImagePaths(currentImages);
    Product updated = service.save(product);
    return ResponseEntity.ok(updated);
}

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) throws IOException {
        Optional<Product> product = service.findById(id);
        if (product.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (product.get().getImagePaths() != null) {
            for (String imagePath : product.get().getImagePaths()) {
                try {
                    Files.deleteIfExists(Paths.get(imagePath));
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }

        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
