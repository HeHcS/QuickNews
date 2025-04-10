import Category from '../models/categoryModel.js';
import Video from '../models/videoModel.js';
import { getCache, setCache, deleteCache, clearCacheByPattern } from '../utils/redisCache.js';

// Cache keys
const CACHE_KEYS = {
  CATEGORIES: 'categories:'
};

/**
 * Create a new category
 * @route POST /api/categories
 * @access Private/Admin
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description, icon, color, sortOrder } = req.body;
    
    // Check if category already exists
    const categoryExists = await Category.findOne({ name: name.trim() });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }
    
    // Create new category
    const category = new Category({
      name,
      description,
      icon,
      color,
      sortOrder: sortOrder || 0
    });
    
    await category.save();
    
    // Clear categories cache
    await clearCacheByPattern(`${CACHE_KEYS.CATEGORIES}*`);
    
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

/**
 * Get all categories
 * @route GET /api/categories
 * @access Public
 */
export const getAllCategories = async (req, res) => {
  try {
    // Create cache key
    const cacheKey = `${CACHE_KEYS.CATEGORIES}all`;
    
    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Fetch all categories, including inactive ones for admins
    const isAdmin = req.user && req.user.role === 'admin';
    const query = isAdmin ? {} : { isActive: true };
    
    const categories = await Category.find(query)
      .sort({ sortOrder: 1, name: 1 });
    
    // Cache the result (longer TTL for categories)
    await setCache(cacheKey, categories, 86400); // 24 hours
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

/**
 * Get a single category by ID
 * @route GET /api/categories/:id
 * @access Public
 */
export const getCategoryById = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Create cache key
    const cacheKey = `${CACHE_KEYS.CATEGORIES}${categoryId}`;
    
    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Cache the result
    await setCache(cacheKey, category, 86400); // 24 hours
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

/**
 * Update a category
 * @route PUT /api/categories/:id
 * @access Private/Admin
 */
export const updateCategory = async (req, res) => {
  try {
    const { name, description, icon, color, isActive, sortOrder } = req.body;
    const categoryId = req.params.id;
    
    const category = await Category.findById(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if name is being changed and if new name already exists
    if (name && name !== category.name) {
      const nameExists = await Category.findOne({ 
        name: name.trim(),
        _id: { $ne: categoryId }
      });
      
      if (nameExists) {
        return res.status(400).json({ message: 'Category name already in use' });
      }
    }
    
    // Update fields
    category.name = name || category.name;
    category.description = description || category.description;
    category.icon = icon || category.icon;
    category.color = color || category.color;
    category.sortOrder = sortOrder !== undefined ? sortOrder : category.sortOrder;
    category.isActive = isActive !== undefined ? isActive : category.isActive;
    
    await category.save();
    
    // Clear categories cache
    await clearCacheByPattern(`${CACHE_KEYS.CATEGORIES}*`);
    
    res.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

/**
 * Delete a category
 * @route DELETE /api/categories/:id
 * @access Private/Admin
 */
export const deleteCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;
    
    // Check if there are videos in this category
    const videosWithCategory = await Video.countDocuments({ categories: categoryId });
    
    if (videosWithCategory > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete category that has videos. Remove all videos from this category first.',
        videosCount: videosWithCategory
      });
    }
    
    const category = await Category.findByIdAndDelete(categoryId);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Clear categories cache
    await clearCacheByPattern(`${CACHE_KEYS.CATEGORIES}*`);
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

/**
 * Get categories with video counts
 * @route GET /api/categories/stats
 * @access Private/Admin
 */
export const getCategoriesWithStats = async (req, res) => {
  try {
    // Use aggregation to get video counts per category
    const categoriesWithStats = await Category.aggregate([
      {
        $lookup: {
          from: 'videos',
          localField: '_id',
          foreignField: 'categories',
          as: 'videos'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          icon: 1,
          color: 1,
          isActive: 1,
          sortOrder: 1,
          videoCount: { $size: '$videos' }
        }
      },
      { $sort: { sortOrder: 1, name: 1 } }
    ]);
    
    res.json(categoriesWithStats);
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ message: 'Error fetching category stats', error: error.message });
  }
}; 