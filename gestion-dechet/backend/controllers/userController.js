const { User, Report, CleaningEvent } = require('../models');
const { Op } = require('sequelize');

exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const whereCondition = {};
    if (search) {
      whereCondition[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }

    const users = await User.findAndCountAll({
      where: whereCondition,
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: (page - 1) * limit
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        totalCount: users.count,
        totalPages: Math.ceil(users.count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des utilisateurs",
      error: error.message
    });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    // Compter tous les utilisateurs
    const totalUsers = await User.count();
    
    // Compter les utilisateurs par rôle
    const usersByRole = await User.count({
      group: ['role']
    });

    // Compter les signalements actifs
    const activeReports = await Report.count({
      where: { status: { [Op.in]: ['pending', 'in_progress'] } }
    });

    // Compter les événements à venir
    const upcomingEvents = await CleaningEvent.count({
      where: { 
        date: { [Op.gte]: new Date() }
      }
    });

    // Compter les employés (workers)
    const totalWorkers = await User.count({
      where: { role: 'worker' }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        usersByRole,
        activeReports,
        upcomingEvents,
        totalWorkers
      }
    });
  } catch (error) {
    console.error('❌ Erreur récupération statistiques:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message
    });
  }
};

exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    await user.update({ role });

    res.json({
      success: true,
      message: "Rôle utilisateur mis à jour avec succès",
      data: { user }
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour rôle:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la mise à jour du rôle",
      error: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé"
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: "Utilisateur supprimé avec succès"
    });
  } catch (error) {
    console.error('❌ Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la suppression de l'utilisateur",
      error: error.message
    });
  }
};